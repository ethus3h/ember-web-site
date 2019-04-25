<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
include('config.php');
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
// from https://stackoverflow.com/questions/2040240/php-function-to-generate-v4-uuid
function guidv4($data)
{
    assert(strlen($data) == 16);

    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
function uuidgen() {
    return guidv4(random_bytes(16));
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
$database=new FractureDB($mysqlTablePrefix.'eite_'.$table, $mysqlUser, $mysqlPassword, $mysqlServer);
$datetime=new DateTime();
$timestamp=$datetime->getTimestamp();
function validateSession() {
    $sessionData=$database->getRow('idxSession', sessionKey, $sessionkey);
    if ($sessionData != null) {
        $sessionExpires=$sessionData[expires];
        if ($sessionExpires > $timestamp) {
            return true;
        }
    }
    return false;
}
function eiteHashSecret($secretkey) {
    return password_hash($secretkey, PASSWORD_DEFAULT);
}
if ($action==='hashSecret') {
    echo eiteHashSecret($secretkey);
}
else {
    if ($action==='getSession') {
        $userData=$database->getRow($table, "publicId", $user);
        if ($userData != null) {
            //print_r($userData);
            //echo $secretkey;
            if(password_verify($secretkey, $userData["hashedSecretKey"])) {
                $newSession=uuidgen();
                $database->addRowFromArrays('idxSession', ['nodeId', 'sessionKey', 'created', 'expires', 'events'], ['NULL', $newSession, $timestamp, $timestamp + 1000, '']);
                $resultsArray=$newSession;
            } else {
                http_response_code(403);
                $resultsArray="ERROR: Could not verify secret key. 2d9e733b-58d1-43bd-b306-bbd46570381e";
            }
        } else {
            http_response_code(403);
            $resultsArray="ERROR: Unknown user. c5e74673-32dd-408a-be6e-165361256fba";
        }
    } elseif (validateSession()) {
        if ($action==='getTable') {
            $resultsArray=$database->getTable($table);
            #print_r($resultsArray);
        } elseif ($action==='getRowByValue') {
            $resultsArray=$database->getRow($table, $field, $value);
        } elseif ($action==='insertNode') {
            // based on https://stackoverflow.com/questions/1939581/selecting-every-nth-item-from-an-array
            $fields=array();
            $values=array();
            $i=0;
            //echo($data);
            $rowData=explode_escaped(",", $data);
            //print_r($rowData);
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
        else {
            http_response_code(400);
            $resultsArray="ERROR: Unknown action. 29a80dff-cbf7-4183-a645-4b6af5a50bdf";
        }
    } else {
        http_response_code(403);
        $resultsArray="ERROR: Session key invalid or expired. 4bb92b44-4e05-452b-bc1c-00156290a2bb"; // UUID for identifying error unambiguously
    }
    echo json_encode ($resultsArray);
}
?>
