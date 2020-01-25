 
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
include('active.fracturedb.php');
function eiteHashSecret($secretkey) {
    return password_hash($secretkey, PASSWORD_DEFAULT);
}
$database=new FractureDB($mysqlTablePrefix.'eite_node', $mysqlUser, $mysqlPassword, $mysqlServer);
$publicId = getParam('publicId');
$secretkey = getParam('secretkey');
$personName = getParam('personName');
$name = getParam('name');
$referrer = getParam('referrer');
$location = getParam('location');
$employeesCount = getParam('employeesCount');
$paymentMethod = getParam('paymentMethod');
$email = getParam('email');
$other = getParam('other');
$userData=$database->getRow('idxPerson', "publicId", $publicId);
if (array_key_exists('publicId', $userData)) {
    http_response_code(403);
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
    <link href="accounts.css" rel="stylesheet" type="text/css">
    <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
    <title>User Access Management</title>
    </head>
    <body><a href="/">← Home</a><br><br>
    <p>ERROR: The requested user account ID already exists!</p>
    </body>
    </html>';
} else {
    $database->addRowFromArrays('idxPerson', ['nodeId', 'publicId', 'hashedSecretKey', 'personName', 'name', 'referrer', 'location', 'employeesCount', 'paymentMethod', 'email', 'other', 'permissions', 'accountCreationDate', 'server_tz'], ['NULL', $publicId, eiteHashSecret($secretkey), $personName, $name, $referrer, $location, $employeesCount, $paymentMethod, $email, $other, '1', gmdate("Y-m-d H:i:s"), date_default_timezone_get()]);
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
    <link href="accounts.css" rel="stylesheet" type="text/css">
    <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
    <title>User Access Management</title>
    </head>
    <body><br><br>
    <p>Added account (new account public ID is: '.$publicId.')! Once your request has been approved, you can log in from the home page.</p><br>
    <p><a href="/">Back to home page</a></p>
    </body>
    </html>';
}
