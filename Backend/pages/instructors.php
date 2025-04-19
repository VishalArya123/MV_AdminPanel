<?php
// Include the database connection file
require_once 'db.php';

// Check if the database connection is established
if (!isset($conn) || $conn->connect_error) {
    sendJsonResponse(['error' => 'Database connection not available'], 500);
}

try {
    // Query to fetch all instructors from the instructors table
    $query = "SELECT * FROM instructors";
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $instructors = [];
    while ($row = $result->fetch_assoc()) {
        $instructors[] = $row;
    }
    
    // Send successful response with instructors data in the format expected by the frontend
    sendJsonResponse([
        'status' => 'success',
        'data' => $instructors
    ]);
    
} catch (Exception $e) {
    error_log("Error fetching instructors: " . $e->getMessage());
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>