import os
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the private key, replacing \n with actual newlines
private_key = os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n')

# Set up Firebase credentials
cred = credentials.Certificate({
  "type": os.getenv('FIREBASE_TYPE'),
  "project_id": os.getenv('FIREBASE_PROJECT_ID'),
  "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
  "private_key": private_key,
  "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
  "client_id": os.getenv('FIREBASE_CLIENT_ID'),
  "auth_uri": os.getenv('FIREBASE_AUTH_URI'),
  "token_uri": os.getenv('FIREBASE_TOKEN_URI'),
  "auth_provider_x509_cert_url": os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
  "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
  "universe_domain": os.getenv('FIREBASE_UNIVERSE_DOMAIN')
})

# Initialize the Firebase app
firebase_admin.initialize_app(cred)

print("Firebase app initialized successfully!")

# Your bot's logic will go here
# ...

import firebase_admin
from firebase_admin import credentials, firestore, auth
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# --- Configuration ---
TELEGRAM_BOT_TOKEN = '7096589006:AAGPcnt_EpsT-ljb0pIURDEBc3iNpUqxQlc'
# IMPORTANT: Replace this with the actual URL where your web app is hosted
WEB_APP_URL = 'https://your-mini-app-url.com' 
FIREBASE_SERVICE_ACCOUNT_KEY_PATH = 'bot/firebase-service-account.json'

# --- Firebase Initialization ---
try:
    cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logging.info("Firebase initialized successfully.")
except Exception as e:
    logging.error(f"Error initializing Firebase: {e}")
    # Exit if Firebase can't be initialized, as it's critical for the bot
    exit()

# --- Logging Setup ---
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


# --- Bot Command Handlers ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handles the /start command.
    Creates a user if they don't exist, generates a Firebase auth token,
    and sends a button to open the web app with the token.
    """
    user = update.effective_user
    user_id = str(user.id)
    logger.info(f"User {user_id} ({user.username}) started the bot.")

    # Create a new user in Firestore if they don't exist
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        logger.info(f"User {user_id} not found in Firestore. Creating new user.")
        user_data = {
            'balance': 0,
            'adViews': 0,
            'lastAdView': 0,
            'walletAddress': '',
            'tasksCompleted': [],
            'referralBonusPaid': False
        }
        # Check for a referrer from the start command (e.g., /start 12345)
        if context.args and context.args[0].isdigit():
            referrer_id = context.args[0]
            user_data['referredBy'] = referrer_id
            logger.info(f"User {user_id} was referred by {referrer_id}")

        user_ref.set(user_data)
        logger.info(f"Created new user: {user_id}")

    # Generate Firebase custom token
    try:
        custom_token = auth.create_custom_token(user_id)
    except Exception as e:
        logger.error(f"Error creating custom token for UID {user_id}: {e}")
        await update.message.reply_text("Sorry, there was an error logging you in. Please try again later.")
        return

    # Pass the token to the Web App URL as a query parameter
    app_url_with_token = f"{WEB_APP_URL}?token={custom_token.decode('utf-8')}"

    # Send the message with the Web App button
    keyboard = [
        [InlineKeyboardButton(
            "🚀 Open App 🚀",
            web_app=WebAppInfo(url=app_url_with_token)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"👋 Welcome, {user.first_name}!\n\n"
        f"Click the button below to open the TRX Earn App and start earning.",
        reply_markup=reply_markup
    )


# --- Main Bot Logic ---
def main() -> None:
    """Start the bot."""
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))

    # Run the bot until the user presses Ctrl-C
    logger.info("Bot is starting...")
    application.run_polling()


if __name__ == '__main__':
    main()
