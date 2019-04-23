<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
$mysqlUser="futuqiur_eite";
$mysqlPassword="UNCONFIGURED";
//from https://stackoverflow.com/questions/13640109/how-to-prevent-browser-cache-for-php-site
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
// from https://stackoverflow.com/questions/14467673/enable-cors-in-htaccess
// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // should do a check here to match $_SERVER['HTTP_ORIGIN'] to a
    // whitelist of safe domains
    header("Access-Control-Allow-Origin: *");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}
// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

}
function explode_escaped($delimiter, $string)
{
    $exploded = explode($delimiter, $string);
    $fixed = array();
    for ($k = 0, $l = count($exploded); $k < $l; ++$k) {
        if ($exploded[$k][strlen($exploded[$k]) - 1] == '\\') {
            if ($k + 1 >= $l) {
                $fixed[] = trim($exploded[$k]);
                break;
            }
            $exploded[$k][strlen($exploded[$k]) - 1] = $delimiter;
            $exploded[$k].= $exploded[$k + 1];
            array_splice($exploded, $k + 1, 1);
            --$l;
            --$k;
        } else $fixed[] = trim($exploded[$k]);
    }
    return $fixed;
}
function getParam($name) {
    if (isset($_GET[$name])) {
        return $_GET[$name];
    } else {
        if (isset($_POST[$name])) {
            return $_POST[$name];
        }
        else
        {
            return '';
        }
    }
}
$table = getParam('table');
$user = getParam('user');
$secretkey = getParam('secretkey');
$action = getParam('action');
$field = getParam('field');
$value = getParam('value');
$data = getParam('data');
$sessionkey = getParam('sessionkey');
$resultsArray=array();
include('active.fracturedb.php');
$database=new FractureDB('futuqiur_eite_'.$table, $mysqlUser, $mysqlPassword);
$datetime=new DateTime();
$timestamp=$datetime->getTimestamp();
if ($action==='getTable') {
    $resultsArray=$database->getTable($table);
    #print_r($resultsArray);
} elseif ($action==='getSession') {
    $database->addRowFromArrays('idxSession', ['nodeId', 'sessionKey', 'created', 'expires', 'events'], ['NULL', 'test', $timestamp, $timestamp + 1000, '']);
    $resultsArray='test';
} elseif ($action==='getRowByValue') {
    $resultsArray=$database->getRow($table, $field, $value);
} elseif ($action==='insertNode') {
    // based on https://stackoverflow.com/questions/1939581/selecting-every-nth-item-from-an-array
    $fields=array();
    $values=array();
    $i=0;
    //echo($data);
    $rowData=explode_escaped(",", $data);
    print_r($rowData);
    foreach($rowData as $value) {
        if ($i++ % 2 == 0) {
            $fields[] = $value;
        }
        else {
            $values[] = $value;
        }
    }
    $resultsArray=$database->addRowFromArrays($table, $fields, $values);
}
echo json_encode ($resultsArray);
?>
