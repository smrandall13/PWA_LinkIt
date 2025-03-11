
<?php // Functions

	function get($key = null, $format = 'string') {
		static $body = null; // Cache decoded JSON to avoid redundant `file_get_contents()` calls
		// Initialize variable
		$variable = '';

		if (isset($_POST[$key])) { // Check in POST
			$variable = $_POST[$key];
		} else if (isset($_GET[$key])) { // Check in GET
			$variable = $_GET[$key];
		} else { // Check in JSON body
			if ($body === null) {
				$data = file_get_contents('php://input');
				$body = json_decode($data, true);
			}
			if (isset($body[$key])) {
				$variable = $body[$key];
			}
		}

		// If no key is provided, return all data
		if ($key === null) {
			return array_merge($_GET, $_POST, $body ?? []);
		}

		// Sanitize & Format
		return format($variable, $format);
	}

 	function format($variable='', $format = 'string',$subformat='') {
		switch ($format) {
			case 'int':
			case 'i':
				$variable = filter_var($variable, FILTER_VALIDATE_INT) !== false ? (int) $variable : 0;
				break;
			case 'float':
			case 'double':
			case 'decimal':
			case 'f':
				$variable = filter_var($variable, FILTER_VALIDATE_FLOAT) !== false ? (float) $variable : 0.0;
				break;
			case 'bool':
				$variable = filter_var($variable, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
				break;
			case 'label':
			case 'l':
				$variable = ucfirst(filter_var($variable, FILTER_SANITIZE_SPECIAL_CHARS) !== false ? $variable : '');
				break;
			case 'email':
			case 'e':
				$variable = filter_var($variable, FILTER_VALIDATE_EMAIL) !== false ? $variable : '';
				break;
			case 'phone':
			case 'p':
				$variable = filter_var($variable, FILTER_VALIDATE_INT) !== false ? (int) $variable : 0;
				break;
			case 'array':
			case 'a':
				$variable = is_array($variable) ? $variable : [];
				break;
			case 'date':
			case 'd':


				// $variable = filter_var($variable, FILTER_VALIDATE_INT) !== false ? (int) $variable : 0;
				break;
			case 'string':
			case 's':
			default:
				if (is_string($variable)){
					$variable = trim(strval($variable));
				}else{
					$variable = json_encode($variable);
				}
				break;

		}
		return $variable;
	}
?>