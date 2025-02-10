<?php
require_once 'db.php';

// Function to handle image upload
function uploadCertificateImage($image) {
    $target_dir = "uploads/certificates/";
    
    // Ensure target directory exists
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    $target_file = $target_dir . basename($image["name"]);
    $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

    // Check if image file is a actual image or fake image
    $check = getimagesize($image["tmp_name"]);
    if($check === false) {
        return ["success" => false, "message" => "File is not an image."];
    }

    // Check file size
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
            "filepath" => $target_file
        ];
    } else {
        return ["success" => false, "message" => "Sorry, there was an error uploading your file."];
    }
}

// Function to create a new certificate
function createCertificate($conn, $title, $image) {
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
    if ($stmt->execute()) {
        return ["success" => true, "message" => "Certificate added successfully"];
    } else {
        return ["success" => false, "message" => "Error adding certificate to database"];
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
    if ($stmt->execute()) {
        return ["success" => true, "message" => "Certificate updated successfully"];
    } else {
        return ["success" => false, "message" => "Error updating certificate"];
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
        if (file_exists($row['certificate_image'])) {
            unlink($row['certificate_image']);
        }
    }

    // Delete from database
    $sql = "DELETE FROM certificates WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        return ["success" => true, "message" => "Certificate deleted successfully"];
    } else {
        return ["success" => false, "message" => "Error deleting certificate"];
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