<?php
// text_testimonials.php
require_once 'db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization, _method');
header('Access-Control-Max-Age: 86400');

define('UPLOAD_DIR', 'uploads/text_testimonials');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $sql = "SELECT * FROM text_testimonials ORDER BY created_at DESC";
            $result = $conn->query($sql);
            if (!$result) {
                throw new Exception("Query failed: " . $conn->error);
            }
            
            $testimonials = [];
            while ($row = $result->fetch_assoc()) {
                $testimonials[] = $row;
            }
            
            sendJsonResponse($testimonials);
            break;

        case 'POST':
            if (isset($_POST['_method']) && $_POST['_method'] === 'DELETE') {
                $result = handleDelete($conn);
                sendJsonResponse(['success' => $result]);  // Explicitly send JSON response
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
                    
                    if (!is_dir(UPLOAD_DIR)) {
                        mkdir(UPLOAD_DIR, 0777, true);
                    }
                    
                    if (!move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . '/' . $newFileName)) {
                        throw new Exception('Failed to upload file.');
                    }
                    
                    $image = $newFileName; // Store only the filename
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

function handleDelete($conn) {
    $id = $conn->real_escape_string($_POST['id']);
    
    // Get the image filename before deleting the record
    $stmt = $conn->prepare("SELECT image FROM text_testimonials WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        if (!empty($row['image'])) {
            $imagePath = UPLOAD_DIR . '/' . $row['image'];
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
        }
    }
    
    $stmt = $conn->prepare("DELETE FROM text_testimonials WHERE id = ?");
    $stmt->bind_param("i", $id);
    if (!$stmt->execute()) {
        return false;  // Return false if delete fails
    }
    
    return true;  // Return true if delete is successful
}

function handleUpdate($conn, $id, $name, $content, $image) {
    if ($image) {
        // Get the old image filename
        $stmt = $conn->prepare("SELECT image FROM text_testimonials WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            if (!empty($row['image'])) {
                $oldImagePath = UPLOAD_DIR . '/' . $row['image'];
                if (file_exists($oldImagePath)) {
                    unlink($oldImagePath);
                }
            }
        }
        
        $sql = "UPDATE text_testimonials SET name=?, content=?, image=? WHERE id=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi", $name, $content, $image, $id);
    } else {
        $sql = "UPDATE text_testimonials SET name=?, content=? WHERE id=?";
        $stmt = $conn->prepare($sql);
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