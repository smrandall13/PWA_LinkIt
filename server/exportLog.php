<?php
	// Define file paths
	$logFile = 'logs/location.log';
	$csvFile = 'logs/location.csv';

	// Check if log file exists
	if (!file_exists($logFile)) {
	die("Log file not found.");
	}

	// Read log file
	$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

	// Open CSV file for writing
	$csv = fopen($csvFile, 'w');

	// Write CSV header
	fputcsv($csv, ['Timezone', 'Timestamp', 'Latitude', 'Longitude']);

	foreach ($lines as $line) {
	// Use regex to extract data
	if (preg_match('/\[(.*?)\] \[(.*?)\] \[(.*?), (.*?)\]/', $line, $matches)) {
		$timezone = $matches[1];
		$timestamp = $matches[2];
		$lat = $matches[3];
		$lng = $matches[4];

		// Write row to CSV
		fputcsv($csv, [$timezone, $timestamp, $lat, $lng]);
	}
	}

	// Close CSV file
	fclose($csv);

	echo "CSV file created: $csvFile";
?>
