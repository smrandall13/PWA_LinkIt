<?php

	// Data Class
	class DATA {

		private static $cache = [];
		private static $root = ".." . DIRECTORY_SEPARATOR . "data" . DIRECTORY_SEPARATOR;

		private static $transactionData = [];
		private static $inTransaction = false;

		private static $createBackups = false;
		private static $createLogs = false;

		private static $softDelete = false;

		private static $MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
		private static $LOG_RETENTION_DAYS = 30; // Keep logs for 30 days

		private static $UNIQUE_FIELDS = ['id'];

		// Log File Path
		private static function logFile($database, $table) {
			$logDir = self::$root . "$database" . DIRECTORY_SEPARATOR . "logs" . DIRECTORY_SEPARATOR;
			if (!is_dir($logDir)) {
			    mkdir($logDir, 0777, true);
			}
			return $logDir . "$table.log";
		}

		// Log Archive Directory
		private static function logArchiveDir($database) {
			$archiveDir = self::$root . "$database" . DIRECTORY_SEPARATOR . "logs" . DIRECTORY_SEPARATOR . "archive" . DIRECTORY_SEPARATOR;
			if (!is_dir($archiveDir)) {
			    mkdir($archiveDir, 0777, true);
			}
			return $archiveDir;
		}

		// Cleanup old logs
		private static function cleanupLogs($database) {
			$archiveDir = self::logArchiveDir($database);
			$files = glob($archiveDir . "*.log");
			$now = time();

			foreach ($files as $file) {
				if (filemtime($file) < ($now - self::$LOG_RETENTION_DAYS * 86400)) {
					unlink($file); // Delete old logs
				}
			}
		}

		// Rotate Log if size exceeds limit
		private static function rotateLog($database, $table) {
			$logFile = self::logFile($database, $table);
			if (file_exists($logFile) && filesize($logFile) > self::$MAX_LOG_SIZE) {
			    $archiveFile = self::logArchiveDir($database) . "$table-" . date('Ymd_His') . ".log";
			    rename($logFile, $archiveFile);

			    // Compress the rotated file
			    $compressedFile = $archiveFile . ".gz";
			    file_put_contents("compress.zlib://".$compressedFile, file_get_contents($archiveFile));
			    unlink($archiveFile); // Remove uncompressed file after compression
			}
		}

		// Write Log Entry
		private static function log($database, $table, $action, $recordId = null, $oldData = null, $newData = null) {
			$logFile = self::logFile($database, $table);
			$timestamp = date('Y-m-d H:i:s');
			$user = isset($_SESSION['user']) ? $_SESSION['user'] : 'SYSTEM';

			$entry = [
			    'timestamp' => $timestamp,
			    'user' => $user,
			    'action' => $action,
			    'record_id' => $recordId,
			    'old_data' => $oldData ? json_encode($oldData) : null,
			    'new_data' => $newData ? json_encode($newData) : null
			];

			// Rotate Log if necessary
			self::rotateLog($database, $table);
			self::cleanupLogs($database);

			// Append new log entry
			file_put_contents($logFile, json_encode($entry) . PHP_EOL, FILE_APPEND);
		}

		// Start a transaction (store original data)
		public static function begin($database, $table) {
			self::validate($database, $table);
			if (self::$inTransaction) throw new Exception("A transaction is already active.");
			self::$transactionData["$database.$table"] = self::data($database, $table);
			self::$inTransaction = true;
			if (self::$createLogs) self::log($database, $table, "TRANSACTION_BEGIN");
		}

		// Commit transaction (write changes to file)
		public static function commit($database, $table) {
			self::validate($database, $table);
			if (!self::$inTransaction) throw new Exception("No active transaction to commit.");
			self::write($database, $table, self::$cache["$database.$table"]);
			self::$transactionData = [];
			self::$inTransaction = false;
			if (self::$createLogs) self::log($database, $table, "TRANSACTION_COMMIT");
		}

		// Rollback transaction (restore original data)
		public static function rollback($database, $table) {
			self::validate($database, $table);
			if (!self::$inTransaction) throw new Exception("No active transaction to rollback.");
			self::$cache["$database.$table"] = self::$transactionData["$database.$table"];
			self::$transactionData = [];
			self::$inTransaction = false;
			if (self::$createLogs) self::log($database, $table, "TRANSACTION_ROLLBACK");
		}

		// Validate Database and Table
		private static function validate($database, $table) {
			if (empty($database) || empty($table)) {
			    throw new InvalidArgumentException("Database and table names are required.");
			}

			// Ensure they contain only valid characters (letters, numbers, underscores)
			if (!preg_match('/^[a-zA-Z0-9_]+$/', $database) || !preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
			    throw new InvalidArgumentException("Invalid database or table name.");
			}

			return true;
		}

		// Get File
		private static function file($database, $table) {
			self::validate($database, $table); // Ensure valid database & table
			return self::$root . "$database" . DIRECTORY_SEPARATOR . "$table.json";
		}

		// Write to File
		private static function write($database, $table, $data) {
			self::validate($database, $table);

			$dataFile = self::file($database, $table);
			$backupDir = self::$root . "$database" . DIRECTORY_SEPARATOR . "backups" . DIRECTORY_SEPARATOR;
			$backupFile = $backupDir . "$table-" . date('Ymd_His') . ".json";

			// Ensure backup directory exists
			if (!is_dir($backupDir)) {
			    mkdir($backupDir, 0777, true);
			}

			// **Create a backup before writing new data**
			if (file_exists($dataFile)) {
			    if (self::$createBackups) copy($dataFile, $backupFile);
			}

			// **Write new data**
			$fp = fopen($dataFile, "c+");
			if (flock($fp, LOCK_EX)) {
			    ftruncate($fp, 0);
			    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
			    fflush($fp);
			    flock($fp, LOCK_UN);
			} else {
			    throw new Exception("Could not lock file for writing: $dataFile");
			}
			fclose($fp);

			self::$cache["$database.$table"] = $data;
		}

		// Retrieve data from JSON file
		private static function data($database, $table) {
			self::validate($database, $table); // Ensure valid database & table

			$dataFile = self::file($database, $table); // Get file location

			// Ensure directory exists
			if (!is_dir(dirname($dataFile))) {
				mkdir(dirname($dataFile), 0777, true);
			}

			// Create file if it doesn't exist
			if (!file_exists($dataFile)) {
				file_put_contents($dataFile, json_encode([]));
			}

			// Use shared lock for reading
			$fp = fopen($dataFile, "r");
			if (flock($fp, LOCK_SH)) { // Shared lock
				$data = json_decode(fread($fp, max(1, filesize($dataFile))), true) ?? [];

				flock($fp, LOCK_UN); // Unlock file
			} else {
				throw new Exception("Could not lock file for reading: $dataFile");
			}
			fclose($fp);

 			// Ensure data is always an array
			if (!is_array($data)) $data = [];

			// Return
			return self::$cache["$database.$table"] = $data;
		}

		// Check Conditions
		private static function checkCondition($rowValue, $operator, $value) {
			switch ($operator) {
			    case '=': return $rowValue === $value;
			    case 'LIKE': return stripos($rowValue, str_replace('%', '', $value)) !== false;
			    case 'NOT LIKE': return stripos($rowValue, str_replace('%', '', $value)) === false;
			    case 'IN': return in_array($rowValue, is_array($value) ? $value : explode(',', $value));
			    case 'NOT IN': return !in_array($rowValue, is_array($value) ? $value : explode(',', $value));
			    case '!=': case '<>': return $rowValue !== $value;
			    case '>': return $rowValue > $value;
			    case '<': return $rowValue < $value;
			    case '>=': return $rowValue >= $value;
			    case '<=': return $rowValue <= $value;
			    default: return false;
			}
		}

		// Matches Conditions
		private static function matchesCondition($record, $condition) {
			foreach ($condition as $cond) {
				if (!isset($cond['field']) || !isset($cond['operator']) || !isset($cond['value'])){
					return false;
				  }else{
					$field = $cond['field'];
					$operator = $cond['operator'];
					$value = $cond['value'];

					if (!isset($record[$field]) || !self::checkCondition($record[$field], $operator, $value)) {
						return false;
					}
				}
			}
			return true;
		}

		// Unique ID
		public static function id($database, $table) {
			self::validate($database, $table); // Ensure valid database & table

			// Fetch existing IDs
			$data = self::data($database, $table);
			$ids = array_column($data, 'id');

			// Get the first three letters of the table name
			$firstThree = substr($table, 0, 3);

			// Generate a unique ID
			do {
			    $randomString = bin2hex(random_bytes(3)); // 6-character hex (3 bytes)
			    $dataID = $firstThree .'-'. $randomString;
			} while (in_array($dataID, $ids)); // Loop until unique

			return $dataID;
		}

		// Get Data
		public static function get($database, $table, $fields = null, $condition = null, $includeDeleted = false) {
			self::validate($database, $table);
			$data = self::data($database, $table);

			// Exclude soft-deleted records unless specified
			if (!$includeDeleted) {
			    $data = array_values(array_filter($data, fn($row) => !isset($row['deleted_at'])));
			}

			// Apply filtering conditions
			if (!empty($condition)) {
			    $data = array_values(array_filter($data, function ($row) use ($condition) {
				   foreach ($condition as $cond) {

					  if (!isset($cond['field']) || !isset($cond['operator']) || !isset($cond['value'])){
						return false;
					  }else{
						$field = $cond['field'];
						$operator = $cond['operator'];
						$value = $cond['value'];

						if (!isset($row[$field]) || !self::checkCondition($row[$field], $operator, $value)) {
							return false;
						}
					}
				   }
				   return true;
			    }));
			}

			// Select specific fields if requested
			if (!empty($fields)) {
			    $data = array_map(fn($row) => array_intersect_key($row, array_flip($fields)), $data);
			}

			return $data;
		}

		// Set Data
		public static function set($database, $table, $fields = null, $condition = null) {
			self::validate($database, $table);
			$data = self::data($database, $table);
			$updated = false;
			$newRecord = $fields ?? [];

			// Check if an ID is provided
			$providedId = isset($newRecord['id']) ? $newRecord['id'] : null;
			if (empty($condition) && !empty($providedId)) {
			    $condition = [['field' => 'id', 'operator' => '=', 'value' => $providedId]];
			}

			if (!empty($condition)) {
			    foreach ($data as &$record) {
				   if (self::matchesCondition($record, $condition)) {
					  $oldData = $record;
					  $record = array_merge($record, $newRecord);
					  $record['updated_at'] = date('Y-m-d H:i:s');
					  $record['deleted_at'] = null; // Restore if previously deleted
					  $record['updated_by'] = isset($_SESSION['user']) ? $_SESSION['user'] : 'SYSTEM';
					  if (self::$createLogs) self::log($database, $table, "UPDATE", $record['id'], $oldData, $record);
					  $updated = true; // Sent Back for Successful Insert
				   }
			    }
			}

			if (!$updated) {
			    $newRecord['id'] = self::id($database, $table);
			    $newRecord['created_at'] = date('Y-m-d H:i:s');
			    $newRecord['created_by'] = isset($_SESSION['user']) ? $_SESSION['user'] : 'SYSTEM';

			    if (self::$createLogs) self::log($database, $table, "INSERT", $newRecord['id'], null, $newRecord);
			    $data[] = $newRecord;
			    $updated = true; // Sent Back for Successful Update
			}

			if (self::$inTransaction) {
			    self::$cache["$database.$table"] = $data;
			} else {
			    self::write($database, $table, $data);
			}

			return $updated ? "success" : "failure";
		}

		// Delete Data
		public static function delete($database, $table, $condition = null) {
			self::validate($database, $table);
			$data = self::data($database, $table);
			if (empty($condition)) return "failure";

			$updated = false;
			foreach ($data as $key => &$record) {
				if (self::matchesCondition($record, $condition)) {
					if (self::$softDelete){
						if (!isset($record['deleted_at'])) {
							if (self::$createLogs) self::log($database, $table, "DELETE", $record['id'], $record);
							$record['deleted_at'] = date('Y-m-d H:i:s');
							$data[$key] = $record;
							$updated = true;
						}
					}else{
						if (self::$createLogs) self::log($database, $table, "DELETE", $record['id'], $record);
						unset($data[$key]);
						$updated = true;
					}
				}
			}
			$data = array_values(array_filter($data));


			if ($updated) {
				if (self::$inTransaction) {
					self::$cache["$database.$table"] = $data;
				} else {
					self::write($database, $table, $data);
				}
			    return "success";
			}

			return "failure";
		}

		// Restore
		public static function restore($database, $table, $condition = null) {
			self::validate($database, $table);
			$data = self::data($database, $table);
			if (empty($condition)) return "failure";

			$updated = false;
			foreach ($data as &$record) {
				if (isset($record['deleted_at']) && self::matchesCondition($record, $condition)) {
					if (self::$createLogs) self::log($database, $table, "RESTORE", $record['id'], $record);
					unset($record['deleted_at']);
					$updated = true;
				}
			}

			if ($updated) {
				if (self::$inTransaction) {
					self::$cache["$database.$table"] = $data;
				} else {
					self::write($database, $table, $data);
				}
				return "success";
			}

			return "failure";
		}

		// Backup
		public static function backup($database, $table) {
			self::validate($database, $table);
			$dataFile = self::file($database, $table);
			$backupDir = self::$root . "$database" . DIRECTORY_SEPARATOR . "backups" . DIRECTORY_SEPARATOR;
			$backupFile = $backupDir . "$table-" . date('Ymd_His') . ".json";

			if (!is_dir($backupDir)) {
			    	mkdir($backupDir, 0777, true);
			}

			if (file_exists($dataFile)) {
				if (copy($dataFile, $backupFile)) {
					if (self::$createLogs) self::log($database, $table, "BACKUP", null, null, ["backup_file" => $backupFile]);
					return "Backup created: " . basename($backupFile);
				}
			}

			return "No data file to backup.";
		}

		// Restore Backup
		public static function restoreBackup($database, $table, $backupFile) {
			self::validate($database, $table);
			$backupDir = self::$root . "$database" . DIRECTORY_SEPARATOR . "backups" . DIRECTORY_SEPARATOR;
			$backupPath = $backupDir . $backupFile;
			$dataFile = self::file($database, $table);

			if (!file_exists($backupPath)) return "Backup file not found.";

			if (copy($backupPath, $dataFile)) {
				$data = json_decode(file_get_contents($dataFile), true);
				if (!is_array($data)) {
					if (self::$createLogs) self::log($database, $table, "RESTORE_BACKUP_FAILED", null, null, ["backup_file" => $backupFile]);
				    	return "Invalid backup data format.";
				}
				self::$cache["$database.$table"] = $data;
				if (self::$createLogs) self::log($database, $table, "RESTORE_BACKUP", null, null, ["backup_file" => $backupFile]);
				return "Backup restored: $backupFile";
			}

			return "Failed to restore backup.";
		}

		// List Backups
		public static function listBackups($database, $table) {
			self::validate($database, $table);
			$backupDir = self::$root . "$database" . DIRECTORY_SEPARATOR . "backups" . DIRECTORY_SEPARATOR;

			if (!is_dir($backupDir)) {
			    return [];
			}

			// List all backups for the table
			$backups = array_values(array_filter(scandir($backupDir), function ($file) use ($table) {
			    return strpos($file, "$table-") === 0;
			}));

			return $backups;
		}

	}

	// Examples
	/*   ~ Get
		- Get all users
		$users = DATA::get('mydatabase', 'accounts');

		- Get only specific fields
		$users = DATA::get('mydatabase', 'accounts', ['name', 'email']);

		- Get users with conditions
		$users = DATA::get('mydatabase', 'accounts', null, [['field' => 'email', 'operator' => 'LIKE', 'value' => '%example.com'],['field' => 'status', 'operator' => '=', 'value' => 'active']]);

		- Get users where ID is in a list
		$users = DATA::get('mydatabase', 'accounts', null, [['field' => 'id', 'operator' => 'IN', 'value' => ['USR123', 'USR456']]]);

	*/
	/*	~ Set (Insert or Update) - return success if successful - Prevents duplicate names

		- Update record if found, otherwise insert
		$response = DATA::set('mydatabase', 'accounts', ['email' => 'shaun@example.com'], [['field' => 'name', 'operator' => '=', 'value' => 'Shaun Randall']]);

		- Insert a completely new record if no match
		$response = DATA::set('mydatabase', 'accounts', ['name' => 'John Doe', 'email' => 'john@example.com']);

	*/
	/*   ~ Delete - return success if successful
		- Delete a user where id is "USR-123456"
		$response = DATA::delete('mydatabase', 'accounts', [['field' => 'id', 'operator' => '=', 'value' => 'USR-123456']]);

		- Delete all inactive users
		$response = DATA::delete('mydatabase', 'accounts', [['field' => 'status', 'operator' => '=', 'value' => 'inactive']]);

		- Attempting to delete without conditions will fail
		$response = DATA::delete('mydatabase', 'accounts');
	*/
	/* 	~ Transations / Multiple
		try {
			DATA::begin('mydatabase', 'accounts');

			DATA::set('mydatabase', 'accounts', ['name' => 'John Doe', 'email' => 'john@example.com']);
			DATA::delete('mydatabase', 'accounts', [['field' => 'email', 'operator' => '=', 'value' => 'old@example.com']]);

			DATA::commit('mydatabase', 'accounts'); // Save all changes
		} catch (Exception $e) {
			DATA::rollback('mydatabase', 'accounts'); // Revert changes if something fails
			echo "Transaction failed: " . $e->getMessage();
		}
	*/
	/* 	~ Backups
		- Create Backup
		echo DATA::backup('mydatabase', 'accounts');

		- Restore Backup
		echo DATA::restoreBackup('mydatabase', 'accounts', 'backup-20230101-123456.json');

		- List Backups
		$backups = DATA::listBackups('mydatabase', 'accounts');
	*/
?>