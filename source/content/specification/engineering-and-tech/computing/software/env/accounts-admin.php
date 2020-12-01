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
$action=getParam('action');
$oldPermissions=getParam('oldPermissions');
$accountId=getParam('accountId');
$zipcode=getParam('zipcode');
$town=getParam('town');
$areaOfCountry=getParam('areaOfCountry');
$country=getParam('country');
if($accessKey === '') {
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
    <link href="accounts.css" rel="stylesheet" type="text/css">
    <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
    <title>User Access Management</title>
    </head>
    <body><a href="/">← Home</a><br><br>';
    echo '<form method="post" action="accounts-admin.php"><label for="accessKey">Login ID: </label> <input type="password" name="accessKey" id="accessKey" required><br><input type="submit" value="Log in to admin panel"></form>';
    echo '</body></html>';
}
else {
    if($accessKey === $mysqlPassword) {
        if($oldPermissions === '' && $action === '') {
            echo '<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="utf-8" />
            <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
            <link href="accounts.css" rel="stylesheet" type="text/css">
            <script src="sorttable.js"></script>
            <script type="text/javascript">
                function sortByCompanyName() {
                    let companyNameHeader=document.getElementById(\'companyNameHeader\');
                    sorttable.innerSortFunction.apply(companyNameHeader, []);
                }
            </script>
            <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
            <title>User Access Management</title>
            </head>
            <body class="noBodyBackground" onLoad="javascript:sortByCompanyName();"><a href="/">← Home</a><br><br>
            <a href="#AddZIPCode">→ Add ZIP Code...</a><br><br>
            <p>Click column headers to sort the table.</p>
            <table class="sortable"><thead><tr><th>ID</th><th>Public ID</th><th>Name</th><th id="companyNameHeader">Company Name</th><th>Referred by</th><th>Email</th><th>Location</th><th>Employees Count</th><th>Payment Method</th><th>Other</th><th>Date added</th><th>Account approved?</th><th>(Dis)Approve</th></tr></thead>
            <tbody>';
            $resultsArray=$database->getTable('idxPerson');
            $counter = 0;
            while ($counter <= (count($resultsArray) - 1)) {
                $userRow=$resultsArray[$counter];
                $permissionWord='Yes';
                if($userRow['permissions'] === '0') {
                    $permissionWord='No';
                }
                $employeeCountDisplay=$userRow['employeesCount'];
                if($employeeCountDisplay === '0') {
                    $employeeCountDisplay='';
                }
                echo '<tr><td>'.$userRow['id'].'</td><td>'.$userRow['publicId'].'</td><td>'.$userRow['personName'].'</td><td>'.$userRow['name'].'</td><td>'.$userRow['referrer'].'</td><td>'.$userRow['email'].'</td><td>'.$userRow['location'].'</td><td>'.$employeeCountDisplay.'</td><td>'.$userRow['paymentMethod'].'</td><td>'.$userRow['other'].'</td><td>'.$userRow['accountCreationDate'].'</td><td>'.$permissionWord.'</td><td><form method="post" action="accounts-admin.php"><input type="hidden" name="oldPermissions" value="'.$userRow['permissions'].'"><input type="hidden" name="accountId" value="'.$userRow['id'].'"><input type="hidden" name="accessKey" value="'.$accessKey.'"><input type="submit" value="Toggle"></form></td></tr>';
                $counter++;
            }
            echo '</tbody></table>
            <h2 id="AddZIPCode">Add ZIP Code</h2>
            <form method="post" action="accounts-admin.php"><input type="hidden" name="action" value="zipCodeUpdate"><input type="hidden" name="accessKey" value="'.$accessKey.'">
                <label for="zipcode">ZIP Code: </label> <input type="text" placeholder="00000" name="zipcode" id="zipcode" required><br>
                <label for="town">Town: </label> <input type="text" placeholder="" name="town" id="town" required><br>
                <label for="areaOfCountry">Area of country (state/province/subdivision): </label> <input type="text" placeholder="" name="areaOfCountry" id="areaOfCountry" required><br>
                <label for="country">Country: </label> <input type="text" placeholder="" name="country" id="country" required><br>
            <input type="submit" value="Add"></form>
            </body></html>';
        }
        else {
            if ($action === 'zipCodeUpdate') {
                $database->addRowFromArrays('ZIPCodes', ['id', 'zipcode', 'town', 'areaOfCountry', 'country'], ['NULL', $zipcode, $town, $areaOfCountry, $country]);
            }
            else {
                if ($oldPermissions === '0') {
                    $database->setField('idxPerson', 'permissions', '1', $accountId);
                }
                else {
                    $database->setField('idxPerson', 'permissions', '0', $accountId);
                }
            }
            echo '<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="utf-8" />
            <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
            <link href="accounts.css" rel="stylesheet" type="text/css">
            <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
            <title>User Access Management</title>
            </head>
            <body><a href="/">← Home</a><br><br>';
            echo '<form method="post" action="accounts-admin.php"><input type="hidden" name="accessKey" value="'.$accessKey.'"><input type="submit" value="Done! Back to management page"></form></td></tr>';
            echo '</body></html>';
        }
    }
    else {
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
        <p>ERROR: Incorrect access key!</p>
        </body>
        </html>';
    }
}
