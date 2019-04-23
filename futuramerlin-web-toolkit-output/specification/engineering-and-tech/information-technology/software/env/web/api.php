<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
$mysqlUser="futuqiur_eite";
$mysqlPassword="UNCONFIGURED";
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
if (isset($_GET['table'])) {
    $table = $_GET['table'];
} else {
    $table = $_POST['table'];
}
if (isset($_GET['user'])) {
    $user = $_GET['user'];
} else {
    $user = $_POST['user'];
}
if (isset($_GET['secretkey'])) {
    $secretkey = $_GET['secretkey'];
} else {
    $secretkey = $_POST['secretkey'];
}
if (isset($_GET['action'])) {
    $action = $_GET['action'];
} else {
    $action = $_POST['action'];
}
if (isset($_GET['field'])) {
    $field = $_GET['field'];
} else {
    $field = $_POST['field'];
}
if (isset($_GET['value'])) {
    $value = $_GET['value'];
} else {
    $value = $_POST['value'];
}
if (isset($_GET['data'])) {
    $data = $_GET['data'];
} else {
    $data = $_POST['data'];
}
if (isset($_GET['sessionkey'])) {
    $sessionkey = $_GET['sessionkey'];
} else {
    $sessionkey = $_POST['sessionkey'];
}
include('active.fracturedb.php');
$database=new FractureDB('futuqiur_eite_'.$table, $mysqlUser, $mysqlPassword);

if ($action==='getTable') {
    $resultsArray=$database->getTable($table);
    #print_r($resultsArray);
} elseif ($action==='getSession') {
    $database->addRow('idxSession', ['id', 'sessionKey', 'created', 'expires', 'events'], ['NULL', 'test', new DateTime()->getTimestamp(), new DateTime()->getTimestamp() + 1000, 'NULL']);
    $resultsArray='test';
} elseif ($action==='getRowByValue') {
    $resultsArray=$database->getRow($table, $field, $value);
} elseif ($action==='insertNode') {
    // based on https://stackoverflow.com/questions/1939581/selecting-every-nth-item-from-an-array
    $fields=array();
    $values=array();
    $i=0;
    $rowData=explode_escaped($data);
    foreach($rowData as $value) {
        if ($i++ % 2 == 0) {
            $fields[] = $value;
        }
        else {
            $values[] = $value;
        }
    }
    $resultsArray=$database->addRow($table, $fields, $values);
}
echo json_encode ($resultsArray);
?>
