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
		$data = get('data','array');

		// Fields
		$fields = get('fields', 'array');
		if (empty($fields) && isset($data['fields'])) $fields = $data['fields'];

		// Attributes
		$attributes = get('attributes', 'array');
		if (empty($attributes) && isset($data['attributes'])) $attributes = $data['attributes'];

		// Relationships
		$relationships = get('relationships', 'array');
		if (empty($relationships) && isset($data['relationships'])) $relationships = $data['relationships'];

		// Condition
		$condition = get('condition', 'array');
		if (empty($condition) && isset($data['condition'])) $condition = $data['condition'];

		$DATA_TYPE = 'json';

		// JSON Data Files
		if ($DATA_TYPE === 'json') {

			// Return Data - JSON
			$RETURN_DATA = ["database"=>$database, "table"=>$table];
			if (!empty($fields)){ 	$RETURN_DATA["fields"] = $fields; }
			if (!empty($condition)){ $RETURN_DATA["condition"] = $condition; }

			// Read
			if ($REQUEST === "get") {
				// Get Records
				$RETURN_DATA["data"][$table] = DATA::get($database, $table, $fields, $condition);
				$RETURN_STATUS = 'success';

			// Create / Update
			}else if ($REQUEST === "set") {
				$RETURN_STATUS = DATA::set($database, $table, $fields, $condition);
				if ($RETURN_STATUS === 'success') {

					$key = "entityid";
					if ($table === "projects") $key = "projectid";
					if ($table === "relationships") $key = "relationshipid";

					// Get Entry
					$getCondition = null;

					// ID Sent in
					if (isset($fields['id']) && !empty($fields['id'])) $getCondition = [["field"=>"id","operator"=>"=","value"=>$fields['id']]];

					// Name Unique ??
					if (empty($getCondition)) $getCondition = [["field"=>"name","operator"=>"=","value"=>$fields['name']]];
					$result = DATA::get($database, $table, ['id','projectid'], [['field'=>'name', 'operator'=>'=', 'value'=>$fields['name']]]);
					$RETURN_DATA["data"][$key] = !empty($result) ? $result[0]['id'] : '';
					if (isset($result[0]['projectid'])) $getCondition = [["field"=>"projectid","operator"=>"=","value"=>$result[0]['projectid']]];

					// Get Records
					$RETURN_DATA["data"][$table] = DATA::get($database, $table,"",$getCondition);

				}

			// Delete
			}else if ($REQUEST === "delete") {

				// Get Entry
				$getCondition = null;
				$result = DATA::get($database, $table, ['id','projectid'],$condition);
				if (isset($result[0]['projectid'])) $getCondition = [["field"=>"projectid","operator"=>"=","value"=>$result[0]['projectid']]];

				// Delete Relationships
				if ($table === "entities") {

				}else if ($table == "projects") {

				}

				$RETURN_STATUS = DATA::delete($database, $table, $condition);
				if ($RETURN_STATUS === 'success') $RETURN_DATA["data"][$table] = DATA::get($database, $table,"",$getCondition);

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