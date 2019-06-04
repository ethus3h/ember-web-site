 
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
$name = getParam('name');
$location = getParam('location');
$employeesCount = getParam('employeesCount');
$paymentMethod = getParam('paymentMethod');
$email = getParam('email');
$other = getParam('other');
$userData=$database->getRow('idxPerson', "publicId", $publicId);
if ($userData != null) {
    http_response_code(403);
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <link href="accounts.css" rel="stylesheet" type="text/css">
    <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
    <title>User Access Management</title>
    </head>
    <body><a href="/">→ Home</a><br><br>
    <p>ERROR: The requested user account ID already exists!</p>
    </body>
    </html>';
}
elseif ($userData["publicId"] != '') {
    http_response_code(403);
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <link href="accounts.css" rel="stylesheet" type="text/css">
    <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
    <title>User Access Management</title>
    </head>
    <body><a href="/">→ Home</a><br><br>
    <p>ERROR: The requested user account ID may already exist!</p>
    </body>
    </html>';
}
else {
    $database->addRowFromArrays('idxPerson', ['nodeId', 'publicId', 'hashedSecretKey', 'name', 'location', 'employeesCount', 'paymentMethod', 'email', 'other', 'permissions'], ['NULL', $publicId, eiteHashSecret($secretkey), $name, $location, $employeesCount, $paymentMethod, $email, $other, '0']);
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <link href="accounts.css" rel="stylesheet" type="text/css">
    <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
    <title>User Access Management</title>
    </head>
    <body><a href="/">→ Home</a><br><br>
    <p>Added account (new account public ID is: '.$publicId.')! After it has been approved, you can start using the account.</p>
    </body>
    </html>';
}
