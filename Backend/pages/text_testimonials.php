<?php
// text_testimonials.php
require_once 'db.php';

// Add CORS headers for all origins
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization, _method');
header('Access-Control-Max-Age: 86400'); // 24 hours cache

// Define upload directory constants
define('BASE_DIR', dirname(__FILE__));
define('UPLOAD_DIR', BASE_DIR . '/uploads/text_testimonials');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Handle preflight requests
    http_response_code(200);
    exit();
}

try {
    error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $sql = "SELECT * FROM text_testimonials ORDER BY created_at DESC";
            error_log("Executing query: " . $sql);
            
            $result = $conn->query($sql);
            if (!$result) {
                throw new Exception("Query failed: " . $conn->error);
            }
            
            $testimonials = [];
            while ($row = $result->fetch_assoc()) {
                if (!empty($row['image'])) {
                    $row['image'] = str_replace('\\', '/', $row['image']);
                }
                $testimonials[] = $row;
            }
            
            sendJsonResponse($testimonials);
            break;

        case 'POST':
            if (isset($_POST['_method']) && $_POST['_method'] === 'DELETE') {
                handleDelete($conn);
                sendJsonResponse(['success' => true]);
            } else {
                $name = $conn->real_escape_string($_POST['name']);
                $content = $conn->real_escape_string($_POST['content']);
                $image = '';
                
                if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
                    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!in_array($_FILES['image']['type'], $allowedTypes)) {
                        throw new Exception('Invalid file type. Only JPG, PNG & GIF allowed.');
                    }
                    
                    $maxSize = 5 * 1024 * 1024; // 5MB
                    if ($_FILES['image']['size'] > $maxSize) {
                        throw new Exception('File too large. Maximum size is 5MB.');
                    }
                    
                    $fileExt = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                    $newFileName = uniqid() . '.' . $fileExt;
                    $uploadPath = UPLOAD_DIR . '/' . $newFileName;
                    
                    if (!move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
                        error_log("Upload failed: " . error_get_last()['message']);
                        throw new Exception('Failed to upload file.');
                    }
                    
                    $image = 'uploads/text_testimonials/' . $newFileName;
                }
                
                if (isset($_POST['id'])) {
                    handleUpdate($conn, $_POST['id'], $name, $content, $image);
                } else {
                    handleCreate($conn, $name, $content, $image);
                }
                
                sendJsonResponse(['success' => true]);
            }
            break;

        default:
            throw new Exception("Invalid request method");
    }
} catch (Exception $e) {
    error_log("Error in text_testimonials.php: " . $e->getMessage());
    sendJsonResponse(['error' => $e->getMessage()], 500);
}

// Helper functions remain the same
function handleDelete($conn) {
    $id = $conn->real_escape_string($_POST['id']);
    $stmt = $conn->prepare("DELETE FROM text_testimonials WHERE id = ?");
    $stmt->bind_param("i", $id);
    if (!$stmt->execute()) {
        throw new Exception("Delete failed: " . $stmt->error);
    }
}

function handleUpdate($conn, $id, $name, $content, $image) {
    $sql = $image ? 
        "UPDATE text_testimonials SET name=?, content=?, image=? WHERE id=?" :
        "UPDATE text_testimonials SET name=?, content=? WHERE id=?";
    
    $stmt = $conn->prepare($sql);
    if ($image) {
        $stmt->bind_param("sssi", $name, $content, $image, $id);
    } else {
        $stmt->bind_param("ssi", $name, $content, $id);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Update failed: " . $stmt->error);
    }
}

function handleCreate($conn, $name, $content, $image) {
    $stmt = $conn->prepare("INSERT INTO text_testimonials (name, content, image) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $content, $image);
    if (!$stmt->execute()) {
        throw new Exception("Create failed: " . $stmt->error);
    }
}

$conn->close();
?>