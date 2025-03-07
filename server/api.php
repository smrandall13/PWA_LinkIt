<?php
	include_once('support.php');

	$COMMAND = get('command');
	$REQUEST = get('request');

	$RETURN_STATUS = 'error';
	$RETURN_MESSAGE = '';
	$RETURN_DATA = '';

	// Date / Time
	date_default_timezone_set('America/Chicago'); // Change to your timezone
	$TIMEZONE = date_default_timezone_get();
	$TZONE = date('T');
	$DATETIME = date('Y-m-d H:i:s');
?>
<?php // Commands

	// Data
	if ($COMMAND === 'data') {
		include_once('data.php');

		$database = get('database');
		$table = get('table');
		$fields = get('fields', 'array');
		$condition = get('condition', 'array');

		$DATA_TYPE = 'json';

		// JSON Data Files
		if ($DATA_TYPE === 'json') {

			// File
			$dataFile = "..\\data\\$database\\$table.json";
			if (file_exists($dataFile)) { // File Exists
				$RETURN_DATA = ["database"=>$database, "table"=>$table];
				if (!empty($fields)){ $RETURN_DATA["fields"] = $fields; }
				if (!empty($condition)){ $RETURN_DATA["condition"] = $condition; }

				// Read
				if ($REQUEST === "read" || $REQUEST === "get") {

					$data = json_decode(file_get_contents($dataFile), true);

					// Limit the reutrn data to that of the conditions
					if (!empty($condition)) {

						$data = array_filter($data, function ($row) use ($condition) {
							foreach ($condition as $cond) {
								$field = $cond['field'];
								$operator = $cond['operator'];
								$value = $cond['value'];

								if (!isset($row[$field])) {
									return false; // Skip rows that don't have the field
								}

								$rowValue = strval($row[$field]);

								if ($operator === '=' && $rowValue !== $value) {
									return false;
								} elseif ($operator === 'LIKE' && stripos($rowValue, str_replace('%', '', $value)) === false) {
									return false;
								}
							}
							return true;
						});
					}

					if (!empty($fields)){
						$data = array_map(function ($row) use ($fields) {
							$filteredRow = [];
							foreach ($fields as $field) {
								if (isset($row[$field])) {
									$filteredRow[$field] = $row[$field];
								}
							}
							return $filteredRow;
						}, $data);
					}

					if (empty($data)) $data = [];

					$RETURN_DATA["data"] = $data ;

					$RETURN_STATUS = 'success';

				// Create / Update
				}else if ($REQUEST === "create" || $REQUEST === "update") {

				// Delete
				}else if ($REQUEST === "delete" || $REQUEST === "remove") {

				}
			}

		}
	}


	// LOCATE
	if ($COMMAND === 'locate') {

		// Ensure the logs directory exists
		$logFile = '..\data\logs\locate.log';
		$stamp = date('Y-m-d H:i:s');

		// Log Location
		if ($REQUEST === 'log'){
			// Variables
			$lat = get('lat','float');
			$lng = get('lng','float');
			$acc = get('acc','float');

			if (!empty($lat) && !empty($lng)){
				// Append to log file
				file_put_contents($logFile,"[{$TZONE}] [{$stamp}] [{$lat}, {$lng}, {$acc}]\n", FILE_APPEND | LOCK_EX);

				$RETURN_STATUS = 'success';
			}

		}
	}

	// Return
	$RETURN = ['status' => $RETURN_STATUS];
	if (!empty($RETURN_MESSAGE)){ $RETURN['message'] = $RETURN_MESSAGE; }
	if (!empty($RETURN_DATA)){ $RETURN['data'] = $RETURN_DATA; }


	header('Content-Type: application/json');
	echo json_encode($RETURN);

?>