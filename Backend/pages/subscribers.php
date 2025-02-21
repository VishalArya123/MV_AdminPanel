<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

// Get the action from the URL
$action = $_GET['action'] ?? '';

// Helper function to send JSON response
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Helper function to send error response
function sendError($message, $statusCode = 400) {
    sendJSON(['error' => $message], $statusCode);
}

try {
    switch ($action) {
        case 'list':
            $stmt = $pdo->query("SELECT * FROM subscribers ORDER BY subscribed_at DESC");
            $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendJSON($subscribers);
            break;

        case 'add':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('Invalid request method');
            }

            $email = $_POST['email'] ?? '';
            $privilege = $_POST['privilege'] ?? 'Registered User';

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendError('Invalid email format');
            }

            $stmt = $pdo->prepare("INSERT INTO subscribers (email, privilege) VALUES (?, ?)");
            $stmt->execute([$email, $privilege]);
            sendJSON(['message' => 'Subscriber added successfully']);
            break;

        case 'update_privilege':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('Invalid request method');
            }

            $id = $_POST['id'] ?? '';
            $privilege = $_POST['privilege'] ?? '';
            
            $allowed_privileges = ['Admin', 'Employee', 'Registered User'];
            if (!in_array($privilege, $allowed_privileges)) {
                sendError('Invalid privilege level');
            }

            $stmt = $pdo->prepare("UPDATE subscribers SET privilege = ? WHERE id = ?");
            $stmt->execute([$privilege, $id]);
            sendJSON(['message' => 'Privilege updated successfully']);
            break;

        case 'delete':
            $id = $_GET['id'] ?? '';
            if (!$id) {
                sendError('No ID provided');
            }

            $stmt = $pdo->prepare("DELETE FROM subscribers WHERE id = ?");
            $stmt->execute([$id]);
            sendJSON(['message' => 'Subscriber deleted successfully']);
            break;

        case 'send_message':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('Invalid request method');
            }

            $selected_subscribers = json_decode($_POST['selected_subscribers'] ?? '[]');
            $message = $_POST['message'] ?? '';

            if (empty($selected_subscribers) || empty($message)) {
                sendError('No subscribers selected or message is empty');
            }

            // Initialize PHPMailer
            require 'PHPMailer/src/Exception.php';
            require 'PHPMailer/src/PHPMailer.php';
            require 'PHPMailer/src/SMTP.php';

            use PHPMailer\PHPMailer\PHPMailer;
            use PHPMailer\PHPMailer\Exception;
            use PHPMailer\PHPMailer\SMTP;

            $success_count = 0;
            $error_count = 0;
            $error_messages = [];

            foreach ($selected_subscribers as $email) {
                try {
                    $mail = new PHPMailer(true);
                    $mail->isSMTP();
                    $mail->Host = 'smtp.gmail.com';
                    $mail->SMTPAuth = true;
                    $mail->Username = 'your-email@gmail.com'; // Replace with your email
                    $mail->Password = 'your-app-password'; // Replace with your app password
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                    $mail->Port = 587;
                    
                    $mail->setFrom('your-email@gmail.com', 'Your Name');
                    $mail->addAddress($email);
                    $mail->isHTML(true);
                    $mail->Subject = 'Subscriber Update';
                    $mail->Body = nl
                    $mail->Body = nl2br(htmlspecialchars($message));
                    $mail->AltBody = strip_tags($message);

                    $mail->send();
                    $success_count++;
                } catch (Exception $e) {
                    $error_count++;
                    $error_messages[] = "Failed to send to $email: " . $mail->ErrorInfo;
                }
            }

            sendJSON([
                'success_count' => $success_count,
                'error_count' => $error_count,
                'error_messages' => $error_messages
            ]);
            break;

        default:
            sendError('Invalid action');
    }
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}