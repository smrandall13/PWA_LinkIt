<?php
	include_once('support.php');

	$COMMAND = get('command');
	$REQUEST = get('request');

	$RETURN_STATUS = 'failure';
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

			// Return Data - JSON
			$RETURN_DATA = ["database"=>$database, "table"=>$table];
			if (!empty($fields)){ 	$RETURN_DATA["fields"] = $fields; }
			if (!empty($condition)){ $RETURN_DATA["condition"] = $condition; }

			// Unique Fields
			$UNIQUE_FIELDS = ['name','id'];

			// Read
			if ($REQUEST === "get") {
				$RETURN_DATA["data"][$table] = DATA::get($database, $table, $fields, $condition);
				$RETURN_STATUS = 'success';

			// Create / Update
			}else if ($REQUEST === "set") {
				$RETURN_STATUS = DATA::set($database, $table, $fields, $condition);
				if ($RETURN_STATUS === 'success') {
					$RETURN_DATA["data"][$table] = DATA::get($database, $table);
					$RETURN_DATA["data"][$table."id"] = DATA::get($database, $table, ['id'], [['field'=>'name', 'operator'=>'=', 'value'=>$fields['name']]]);
				}

			// Delete
			}else if ($REQUEST === "delete") {
				$RETURN_STATUS = DATA::delete($database, $table, $condition);
				if ($RETURN_STATUS === 'success') $RETURN_DATA["data"] = DATA::get($database, $table);

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