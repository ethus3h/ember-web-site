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
$database=new FractureDB($mysqlTablePrefix.'eite_node', $mysqlUser, $mysqlPassword, $mysqlServer);
$accessKey=getParam('accessKey');
$oldPermissions=getParam('oldPermissions');
$accountId=getParam('accountId');
if($accessKey === $mysqlPassword) {
    if($oldPermissions === '') {
        echo '<!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8" />
        <link href="accounts.css" rel="stylesheet" type="text/css">
        <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
        <title>User Access Management</title>
        </head>
        <body><a href="/">← Home</a><br><br>
        <table><thead><tr><th>ID</th><th>Public ID</th><th>Name</th><th>Location</th><th>Employees Count</th><th>Payment Method</th><th>Email</th><th>Other</th><th>Account approved?</th><th>(Dis)Approve</th></tr></thead>
        <tbody>';
        $resultsArray=$database->getTable('idxPerson');
        $counter = 0;
        while ($counter <= (count($resultsArray) - 1)) {
            $userRow=$resultsArray[$counter];
            echo '<tr><td>'.$userRow['id'].'</td><td>'.$userRow['publicId'].'</td><td>'.$userRow['name'].'</td><td>'.$userRow['location'].'</td><td>'.$userRow['employeesCount'].'</td><td>'.$userRow['paymentMethod'].'</td><td>'.$userRow['email'].'</td><td>'.$userRow['other'].'</td><td>'.$userRow['permissions'].'</td><td><form method="post" action="accounts-admin.php"><input type="hidden" name="oldPermissions" value="'.$userRow['permissions'].'"><input type="hidden" name="accountId" value="'.$userRow['id'].'"><input type="hidden" name="accessKey" value="'.$accessKey.'"><input type="submit" value="Toggle"></form></td></tr>';
            $counter++;
        }
        echo '</tbody></table></body></html>';
    }
    else {
        if ($oldPermissions === '0') {
            $database->setField('idxPerson', 'permissions', '1', $accountId);
        }
        else {
            $database->setField('idxPerson', 'permissions', '0', $accountId);
        }
    }
}
else {
    http_response_code(403);
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <link href="accounts.css" rel="stylesheet" type="text/css">
    <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
    <title>User Access Management</title>
    </head>
    <body><a href="/">← Home</a><br><br>
    <p>ERROR: Incorrect access key!</p>
    </body>
    </html>';
}
