<?php
// Include database connection
require_once 'db.php';

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle different operations based on action parameter
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

switch ($action) {
    case 'get':
        // Get all users
        getUsers($conn);
        break;
    case 'add':
        // Add a new user
        addUser($conn);
        break;
    case 'update':
        // Update existing user
        updateUser($conn);
        break;
    case 'delete':
        // Delete a user
        deleteUser($conn);
        break;
    default:
        // Invalid action
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        break;
}

/**
 * Get all users from database
 */
function getUsers($conn) {
    $sql = "SELECT id, name, email, privilege FROM users ORDER BY id";
    $result = $conn->query($sql);
    
    $users = array();
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode($users);
    } else {
        echo json_encode([]);
    }
}

/**
 * Add a new user to database
 */
function addUser($conn) {
    // Check if required fields are provided
    if (!isset($_POST['name']) || !isset($_POST['email']) || !isset($_POST['privilege'])) {
        echo json_encode(['status' => 'error', 'message' => 'Required fields missing']);
        return;
    }
    
    $name = $conn->real_escape_string($_POST['name']);
    $email = $conn->real_escape_string($_POST['email']);
    $privilege = $conn->real_escape_string($_POST['privilege']);
    
    $sql = "INSERT INTO users (name, email, privilege) VALUES ('$name', '$email', '$privilege')";
    
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'success', 'message' => 'User added successfully', 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add user: ' . $conn->error]);
    }
}

/**
 * Update an existing user
 */
function updateUser($conn) {
    // Check if required fields are provided
    if (!isset($_POST['id'])) {
        echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
        return;
    }
    
    $id = $conn->real_escape_string($_POST['id']);
    $updateFields = [];
    
    // Build dynamic update query based on provided fields
    if (isset($_POST['name'])) {
        $name = $conn->real_escape_string($_POST['name']);
        $updateFields[] = "name = '$name'";
    }
    
    if (isset($_POST['email'])) {
        $email = $conn->real_escape_string($_POST['email']);
        $updateFields[] = "email = '$email'";
    }
    
    if (isset($_POST['privilege'])) {
        $privilege = $conn->real_escape_string($_POST['privilege']);
        $updateFields[] = "privilege = '$privilege'";
    }
    
    if (empty($updateFields)) {
        echo json_encode(['status' => 'error', 'message' => 'No fields to update']);
        return;
    }
    
    $sql = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = $id";
    
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'success', 'message' => 'User updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update user: ' . $conn->error]);
    }
}

/**
 * Delete a user
 */
function deleteUser($conn) {
    // Check if ID is provided
    if (!isset($_POST['id'])) {
        echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
        return;
    }
    
    $id = $conn->real_escape_string($_POST['id']);
    
    $sql = "DELETE FROM users WHERE id = $id";
    
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'success', 'message' => 'User deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete user: ' . $conn->error]);
    }
}
?>