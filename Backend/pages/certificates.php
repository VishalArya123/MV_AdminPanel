<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'db.php';

// Define upload directory
define('UPLOAD_DIR', 'uploads/certificates');

// Function to handle image upload
function uploadCertificateImage($image) {
    $target_dir = UPLOAD_DIR . "/";
    
    // Ensure target directory exists
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    // Validate file upload
    if (!$image || $image['error'] !== UPLOAD_ERR_OK) {
        return ["success" => false, "message" => "Invalid file upload"];
    }

    $target_file = $target_dir . basename($image["name"]);
    $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

    // Check if image file is a actual image or fake image
    $check = getimagesize($image["tmp_name"]);
    if($check === false) {
        return ["success" => false, "message" => "File is not an image."];
    }

    // Check file size (500KB max)
    if ($image["size"] > 500000) {
        return ["success" => false, "message" => "Sorry, your file is too large."];
    }

    // Allow certain file formats
    $allowed_types = ["jpg", "jpeg", "png", "gif"];
    if(!in_array($imageFileType, $allowed_types)) {
        return ["success" => false, "message" => "Sorry, only JPG, JPEG, PNG & GIF files are allowed."];
    }

    // Generate unique filename to prevent overwriting
    $unique_filename = uniqid() . '.' . $imageFileType;
    $target_file = $target_dir . $unique_filename;

    // Try to upload file
    if (move_uploaded_file($image["tmp_name"], $target_file)) {
        return [
            "success" => true, 
            "message" => "File uploaded successfully", 
            "filepath" => $unique_filename
        ];
    } else {
        return ["success" => false, "message" => "Sorry, there was an error uploading your file."];
    }
}

// Function to create a new certificate
function createCertificate($conn, $title, $image) {
    // Validate input
    if (empty($title)) {
        return ["success" => false, "message" => "Certificate title cannot be empty"];
    }

    // Sanitize title
    $title = htmlspecialchars(trim($title), ENT_QUOTES, 'UTF-8');

    // Upload image first
    $upload_result = uploadCertificateImage($image);
    
    if (!$upload_result['success']) {
        return $upload_result;
    }

    // Prepare SQL and bind parameters
    $sql = "INSERT INTO certificates (certificate_title, certificate_image) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $title, $upload_result['filepath']);
    
    // Execute the statement
    try {
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Certificate added successfully"];
        } else {
            error_log("Database insert error: " . $stmt->error);
            return ["success" => false, "message" => "Error adding certificate to database"];
        }
    } catch (Exception $e) {
        error_log("Exception in createCertificate: " . $e->getMessage());
        return ["success" => false, "message" => "Unexpected error occurred"];
    }
}

// Function to get all certificates
function getAllCertificates($conn) {
    $sql = "SELECT * FROM certificates ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    $certificates = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $certificates[] = $row;
        }
    }
    return $certificates;
}

// Function to update a certificate
function updateCertificate($conn, $id, $title, $image = null) {
    // Validate input
    if (empty($title)) {
        return ["success" => false, "message" => "Certificate title cannot be empty"];
    }

    // Sanitize title
    $title = htmlspecialchars(trim($title), ENT_QUOTES, 'UTF-8');

    if ($image) {
        // Upload new image
        $upload_result = uploadCertificateImage($image);
        
        if (!$upload_result['success']) {
            return $upload_result;
        }

        // Prepare SQL with image update
        $sql = "UPDATE certificates SET certificate_title = ?, certificate_image = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssi", $title, $upload_result['filepath'], $id);
    } else {
        // Prepare SQL without image update
        $sql = "UPDATE certificates SET certificate_title = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $title, $id);
    }
    
    // Execute the statement
    try {
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Certificate updated successfully"];
        } else {
            error_log("Database update error: " . $stmt->error);
            return ["success" => false, "message" => "Error updating certificate"];
        }
    } catch (Exception $e) {
        error_log("Exception in updateCertificate: " . $e->getMessage());
        return ["success" => false, "message" => "Unexpected error occurred"];
    }
}

// Function to delete a certificate
function deleteCertificate($conn, $id) {
    // First, get the image path to delete the file
    $sql = "SELECT certificate_image FROM certificates WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        // Delete the image file
        $image_path = UPLOAD_DIR . '/' . $row['certificate_image'];
        if (file_exists($image_path)) {
            unlink($image_path);
        }
    }

    // Delete from database
    $sql = "DELETE FROM certificates WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    
    try {
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Certificate deleted successfully"];
        } else {
            error_log("Database delete error: " . $stmt->error);
            return ["success" => false, "message" => "Error deleting certificate"];
        }
    } catch (Exception $e) {
        error_log("Exception in deleteCertificate: " . $e->getMessage());
        return ["success" => false, "message" => "Unexpected error occurred"];
    }
}

// Handle API Requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        switch($_POST['action']) {
            case 'create':
                $response = createCertificate($conn, $_POST['title'], $_FILES['image']);
                break;
            case 'update':
                $response = updateCertificate($conn, $_POST['id'], $_POST['title'], $_FILES['image'] ?? null);
                break;
            case 'delete':
                $response = deleteCertificate($conn, $_POST['id']);
                break;
            default:
                $response = ["success" => false, "message" => "Invalid action"];
        }

        echo json_encode($response);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $certificates = getAllCertificates($conn);
    echo json_encode($certificates);
}
?>