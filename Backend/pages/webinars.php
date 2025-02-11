<?php
// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

// Check if the uploads/webinars directory exists and create it if needed
$webinarsDir = dirname(__FILE__) . '/uploads/webinars';
if (!file_exists($webinarsDir)) {
    $oldmask = umask(0);
    if (!@mkdir($webinarsDir, 0755, true)) {
        error_log("Failed to create webinars directory");
        throw new Exception("Failed to create webinars directory");
    }
    umask($oldmask);
}

function handleImageUpload() {
    $target_dir = "uploads/webinars/";
    
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $file = $_FILES['image'];
    $filename = uniqid() . '_' . basename($file["name"]);
    $target_file = $target_dir . $filename;
    
    // Validate file type
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime_type, $allowed_types)) {
        throw new Exception("Invalid file type. Only JPG, PNG and GIF allowed.");
    }
    
    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception("File is too large. Maximum size is 5MB.");
    }
    
    if (!move_uploaded_file($file["tmp_name"], $target_file)) {
        throw new Exception("Failed to upload image.");
    }
    
    return $filename;
}

function deleteImage($image_path) {
    if ($image_path && file_exists("uploads/webinars/" . $image_path)) {
        unlink("uploads/webinars/" . $image_path);
    }
}

$request_method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

try {
    switch($request_method) {
        case 'GET':
            if ($endpoint === 'groups') {
                $query = "SELECT * FROM webinar_groups ORDER BY name ASC";
                $result = $conn->query($query);
                if (!$result) {
                    throw new Exception('Database query failed: ' . $conn->error);
                }
                $groups = $result->fetch_all(MYSQLI_ASSOC);
                sendJsonResponse($groups);
            } 
            elseif ($endpoint === 'webinars') {
                if (!isset($_GET['group_id'])) {
                    throw new Exception('Group ID is required');
                }
                
                $query = "SELECT w.*, g.name as group_name 
                         FROM webinars w 
                         LEFT JOIN webinar_groups g ON w.group_id = g.id 
                         WHERE w.group_id = ? 
                         ORDER BY w.date ASC, w.time ASC";
                $stmt = $conn->prepare($query);
                $stmt->bind_param("i", $_GET['group_id']);
                $stmt->execute();
                $result = $stmt->get_result();
                $webinars = $result->fetch_all(MYSQLI_ASSOC);
                sendJsonResponse($webinars);
            }
            break;

        case 'POST':
            if ($endpoint === 'webinars') {
                if (!isset($_POST['group_id'])) {
                    throw new Exception("Group ID is required");
                }
                
                $conn->begin_transaction();
                
                try {
                    $image_path = handleImageUpload();
                    
                    // Check if this is an update (id parameter is present)
                    if (isset($_GET['id'])) {
                        // Get current webinar data
                        $check_query = "SELECT image_path FROM webinars WHERE id = ?";
                        $check_stmt = $conn->prepare($check_query);
                        $check_stmt->bind_param("i", $_GET['id']);
                        $check_stmt->execute();
                        $current_webinar = $check_stmt->get_result()->fetch_assoc();
                        
                        if (!$current_webinar) {
                            throw new Exception("Webinar not found");
                        }
                        
                        // If new image uploaded, delete old image
                        if ($image_path && $current_webinar['image_path']) {
                            deleteImage($current_webinar['image_path']);
                        }
                        
                        // Use the old image path if no new image was uploaded
                        $final_image_path = $image_path ?: $current_webinar['image_path'];
                        
                        $query = "UPDATE webinars SET 
                            group_id = ?, title = ?, description = ?, date = ?, 
                            time = ?, duration = ?, status = ?, speaker = ?, 
                            registration_link = ?, image_path = ?
                            WHERE id = ?";
                        
                        $stmt = $conn->prepare($query);
                        $stmt->bind_param("isssssssssi",
                            $_POST['group_id'],
                            $_POST['title'],
                            $_POST['description'],
                            $_POST['date'],
                            $_POST['time'],
                            $_POST['duration'],
                            $_POST['status'],
                            $_POST['speaker'],
                            $_POST['registration_link'],
                            $final_image_path,
                            $_GET['id']
                        );
                    } else {
                        // Insert new webinar
                        $query = "INSERT INTO webinars (
                            group_id, title, description, date, time, 
                            duration, status, speaker, registration_link, image_path
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                        
                        $stmt = $conn->prepare($query);
                        $stmt->bind_param("isssssssss", 
                            $_POST['group_id'],
                            $_POST['title'],
                            $_POST['description'],
                            $_POST['date'],
                            $_POST['time'],
                            $_POST['duration'],
                            $_POST['status'],
                            $_POST['speaker'],
                            $_POST['registration_link'],
                            $image_path
                        );
                    }
                    
                    if (!$stmt->execute()) {
                        throw new Exception('Failed to ' . (isset($_GET['id']) ? 'update' : 'add') . ' webinar: ' . $stmt->error);
                    }
                    
                    $conn->commit();
                    sendJsonResponse([
                        'message' => 'Webinar ' . (isset($_GET['id']) ? 'updated' : 'added') . ' successfully',
                        'id' => isset($_GET['id']) ? $_GET['id'] : $conn->insert_id
                    ]);
                } catch (Exception $e) {
                    $conn->rollback();
                    throw $e;
                }
            }
            break;

        case 'DELETE':
            if ($endpoint === 'webinars') {
                if (!isset($_GET['id'])) {
                    throw new Exception("Webinar ID is required");
                }
                
                $conn->begin_transaction();
                
                try {
                    // Get image path before deletion
                    $check_query = "SELECT image_path FROM webinars WHERE id = ?";
                    $check_stmt = $conn->prepare($check_query);
                    $check_stmt->bind_param("i", $_GET['id']);
                    $check_stmt->execute();
                    $webinar = $check_stmt->get_result()->fetch_assoc();
                    
                    if ($webinar && $webinar['image_path']) {
                        deleteImage($webinar['image_path']);
                    }
                    
                    $query = "DELETE FROM webinars WHERE id = ?";
                    $stmt = $conn->prepare($query);
                    $stmt->bind_param("i", $_GET['id']);
                    
                    if (!$stmt->execute()) {
                        throw new Exception('Failed to delete webinar: ' . $stmt->error);
                    }
                    
                    $conn->commit();
                    sendJsonResponse(['message' => 'Webinar deleted successfully']);
                } catch (Exception $e) {
                    $conn->rollback();
                    throw $e;
                }
            }
            break;

        default:
            throw new Exception("Invalid request method");
    }
} catch (Exception $e) {
    error_log("Error in webinars.php: " . $e->getMessage());
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>