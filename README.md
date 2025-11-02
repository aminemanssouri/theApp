<div align="center">
  <h1>🔧 BRICOLLANO</h1>
  <p>A modern on-demand home services marketplace built with React Native & Expo</p>
  
  ![React Native](https://img.shields.io/badge/React_Native-0.79.5-61DAFB?style=flat-square&logo=react)
  ![Expo](https://img.shields.io/badge/Expo-SDK_53-000020?style=flat-square&logo=expo)
  ![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)
  ![TypeScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript)
</div>

---

## 📱 About BRICOLLANO

BRICOLLANO is a comprehensive service marketplace application that connects users with verified professionals for various home and personal services. From cleaning and plumbing to painting and repairs, users can discover services, book appointments, track bookings, and make secure payments through multiple payment methods including cryptocurrency.

### ✨ Key Features

- 🔐 **Complete Authentication Flow**: Email-based auth with OTP verification, biometric login support
- 🏠 **Service Discovery**: Browse categories, search services, view detailed worker profiles
- 📅 **Multi-Step Booking System**: Service selection, worker choice, scheduling, and address management
- 💳 **Dual Payment Processing**: Traditional cards via Stripe + cryptocurrency via Coinbase Commerce
- 💬 **Real-time Chat**: In-app messaging with GiftedChat integration
- ⭐ **Reviews & Ratings**: Interactive star ratings and detailed reviews
- 🔔 **Push Notifications**: Real-time updates for bookings, messages, and system notifications
- 🌍 **Multi-language Support**: Dynamic language switching with i18n
- 🌙 **Dark Mode**: Complete theme support with automatic/manual toggle
- 📊 **Comprehensive Booking Management**: Track upcoming, completed, and cancelled bookings

---

## 🏗 Architecture Overview

### Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React Native | 0.79.5 | Cross-platform mobile framework |
| **Framework** | Expo | SDK 53 | Development and deployment platform |
| **Backend** | Supabase | 2.51.0 | Authentication, database, real-time features |
| **Navigation** | React Navigation | 6.x | Screen routing and navigation |
| **Payments** | Stripe React Native | 0.45.0 | Credit card processing |
| **Crypto Payments** | Coinbase Commerce | Custom | Cryptocurrency payments |
| **Chat** | React Native Gifted Chat | 2.4.0 | Real-time messaging |
| **State Management** | React Context API | - | Global state management |
| **Maps** | React Native Maps | 1.20.1 | Location services |

### Project Structure

```
bricollano/
├── 📱 App.js                   # App entry point with providers
├── 📱 screens/                 # 50+ feature screens
│   ├── auth/                   # Login, Signup, OTP flows
│   ├── onboarding/             # 4-step onboarding (Onboarding1-4)
│   ├── booking/                # BookingStep1, BookingDetails, etc.
│   ├── payment/                # CreditCardPayment, CryptoPayment
│   ├── profile/                # EditProfile, Settings screens
│   └── main/                   # Home, Search, Notifications
├── 🧩 components/              # 25+ reusable UI components
│   ├── cards/                  # ServiceCard, BookingItem, ReviewCard
│   ├── inputs/                 # Input, SearchInputBar, DatePicker
│   ├── modals/                 # DatePickerModal, bottomsheets
│   └── navigation/             # Header, TabView components
├── 🧭 navigations/             # Navigation configuration
│   ├── AppNavigation.js        # Main stack navigator (60+ screens)
│   └── BottomTabNavigation.js  # Tab navigation (Home, Search, etc.)
├── 🌐 context/                 # React Context providers
│   ├── AuthContext.js          # Authentication state & user profile
│   ├── NotificationContext.js  # Push notifications management
│   └── LanguageContext.js      # Internationalization
├── 📡 lib/                     # External integrations
│   ├── supabase.js            # Supabase client with AsyncStorage
│   └── services/              # API service modules
├── ⚙️ config/                  # Configuration files
│   ├── stripe.config.js       # Stripe payment configuration
│   └── coinbase.config.js     # Coinbase Commerce setup
├── 🎨 constants/               # Design system
│   ├── theme.js               # Colors, typography
│   ├── fonts.js               # Font definitions
│   └── icons.js               # Icon mappings
├── 🗄️ database/               # SQL migrations
│   └── notification_settings.sql # Database schema
└── 🛠️ utils/                  # Helper functions
```

---

## 🔧 Core Features Deep Dive

### Authentication System
- **Multi-step Onboarding**: 4-screen flow (Onboarding1-4) for first-time users
- **Email Authentication**: Supabase Auth with OTP verification
- **Biometric Support**: Touch ID/Face ID via expo-local-authentication
- **Profile Management**: Extended user profiles with image upload
- **Session Persistence**: AsyncStorage integration for offline auth

### Booking Flow
1. **Service Discovery** (Home.js, AllServices.js)
2. **Service Selection** (ServiceDetails.js, WorkerDetails.js)
3. **Booking Configuration** (BookingStep1.js with addons)
4. **Address & Scheduling** (YourAddress.js with calendar integration)
5. **Payment Processing** (PaymentMethods.js → CreditCard/CryptoPayment.js)
6. **Confirmation** (BookingDetails.js, EReceipt.js)

### Payment Integration
- **Stripe**: Full card processing with react-native-credit-card-input
- **Coinbase Commerce**: 6 supported cryptocurrencies (BTC, ETH, USDC, etc.)
- **Payment Methods**: Add/manage multiple payment options
- **Receipt System**: Digital receipts with booking details

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 18+
npm or yarn
Expo CLI
iOS Simulator (Mac) / Android Emulator
Supabase account
Stripe account (for payments)
Coinbase Commerce account (for crypto)
```

### Installation

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd theApp
   npm install
   ```

2. **Environment Setup**
   Create `.env` file:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   COINBASE_API_KEY=your_coinbase_key
   ```

3. **Supabase Configuration**
   - Create new Supabase project
   - Run migrations from `database/` folder
   - Enable Row Level Security (RLS)
   - Configure authentication providers

4. **Payment Setup**
   - Update `config/stripe.config.js` with your keys
   - Update `config/coinbase.config.js` with your API credentials
   - Configure webhook endpoints for production

5. **Start Development**
   ```bash
   npm start
   # Press 'a' for Android, 'i' for iOS, 'w' for web
   ```

---

## 📱 App Configuration

### Expo Configuration (`app.json`)
- **App Name**: BRICOLLANO
- **Package**: bricollano.info.com
- **Platforms**: iOS, Android, Web
- **Plugins**: Stripe, Push Notifications, Fonts
- **EAS Project ID**: Configured for deployment

### Navigation Flow
```
Initial → (First Launch?) → Onboarding1-4 → Welcome → Login/Signup
                       ↓
Auth Success → Main (BottomTabs) → Home/Search/Bookings/Inbox/Profile
                       ↓
Service Flow → ServiceDetails → BookingStep1 → Payment → Confirmation
```

---

## 🔔 Notifications & Real-time Features

### Push Notifications
- **Expo Notifications**: Cross-platform push notifications
- **Real-time Updates**: Booking status, payment confirmations
- **Chat Notifications**: New message alerts
- **Customizable Settings**: Per-user notification preferences via `notification_settings` table

### Real-time Chat
- **GiftedChat Integration**: Full-featured chat with React Native Gifted Chat
- **Message States**: Sent, delivered, read receipts
- **File Support**: Image sharing capabilities
- **Conversation Management**: Persistent chat history

---

## 🌍 Internationalization

Multi-language support with dynamic switching:
- **Languages**: English, French, Spanish, Arabic
- **RTL Support**: Right-to-left layout for Arabic
- **Context-based**: `LanguageContext.js` for app-wide language state
- **Screen Coverage**: All major screens translated

---

## 🛠️ Development Scripts

```bash
# Development
npm start                # Start Expo development server
npm run android         # Run on Android device/emulator
npm run ios            # Run on iOS device/simulator
npm run web            # Run in web browser

# Code Quality
npm run format:check    # Check code formatting with Prettier
npm run format:write    # Auto-format code with Prettier
npm run lint:check     # Check for ESLint issues
npm run lint:fix       # Auto-fix ESLint issues
```

---

## 🗄️ Database Schema (Supabase)

### Core Tables

#### User Management
- **auth.users**: Supabase authentication (managed)
- **users**: Extended user profiles with personal information
- **user_roles**: Role-based access control system
- **user_devices**: Device management for push notifications
- **user_push_tokens**: Expo push notification tokens

#### Service Management
- **service_categories**: Service categorization with icons
- **services**: Available services catalog with pricing
- **service_addons**: Additional service options
- **service_translations**: Multi-language support (EN/IT)
- **service_category_translations**: Translated category names

#### Worker System
- **workers**: Service provider profiles with ratings
- **worker_services**: Worker-service mappings with custom pricing
- **worker_statistics**: Performance metrics and earnings

#### Booking & Payment Flow
- **bookings**: Complete booking lifecycle management
- **booking_addons**: Selected add-ons per booking
- **payments**: Payment processing (Stripe, Crypto, PayPal)
- **crypto_payments**: Cryptocurrency transaction details
- **paypal_payments**: PayPal-specific payment data

#### Communication System
- **conversations**: Chat conversations linked to bookings
- **conversation_participants**: User participation in chats
- **messages**: Chat message history with file support
- **message_status**: Read receipts and delivery status

#### Engagement & Feedback
- **reviews**: Booking reviews with 1-5 star ratings
- **favorites**: User favorites (services/workers)
- **notifications**: System notifications with channel support
- **notification_preferences**: Per-user notification settings

#### System Administration
- **roles**: Permission-based role definitions
- **system_settings**: Application configuration
- **reports**: Administrative reporting system

### Advanced Features

#### Multi-language Support
- Supports English and Italian translations
- Separate translation tables for services and categories
- Language-specific content delivery

#### Payment Processing
- **Multiple Payment Methods**: Credit cards, cryptocurrency, PayPal
- **Transaction Tracking**: Complete payment lifecycle
- **Currency Support**: EUR default with multi-currency capability

#### Real-time Features
- **Pusher Integration**: Real-time chat with channel management
- **Message Status**: Delivery and read receipts
- **Live Notifications**: Instant booking updates

### Database Relationships & Business Logic

#### Key Relationships
```
Users (auth.users) ←→ Users (public.users) [1:1]
Users → Bookings [1:many] (as clients)
Workers → Bookings [1:many] (as service providers)  
Workers → Reviews [1:many]
Bookings → Payments [1:1]
Bookings → Conversations [1:1]
Services → Service Addons [1:many]
```

#### Business Rules Implemented
- **Rating System**: 1-5 star ratings with decimal averages
- **Booking Status Flow**: pending → confirmed → in_progress → completed/cancelled
- **Payment Status**: pending → processing → completed/failed
- **Message Types**: text, image, file support
- **Multi-currency**: EUR default, extensible to other currencies
- **Role-based Access**: Admin, Worker, Client roles with permissions

#### Data Integrity Features
- **UUID Primary Keys**: All tables use UUID for distributed systems
- **Timestamps**: Automatic created_at/updated_at tracking
- **Soft Deletes**: Maintained through is_active flags
- **Constraints**: Rating bounds (1-5), email validation, enum types
- **Indexes**: Performance optimization on frequently queried fields

### Row Level Security (RLS)
All tables implement comprehensive RLS policies:
- Users can only access their own data
- Workers can manage their profiles and bookings
- Public data (services, categories) accessible to authenticated users
- Admin-only access for system settings and reports

---

## 🔒 Security Considerations

- ⚠️ **Environment Variables**: Never commit API keys - use `.env` files
- 🔐 **RLS Policies**: All Supabase tables protected with Row Level Security
- 🛡️ **Input Validation**: Client and server-side validation with `validate.js`
- 🔑 **Authentication**: Secure session management with Supabase Auth
- 💳 **Payment Security**: PCI-compliant payment processing (no card data stored)
- 🔒 **Biometric Auth**: Optional enhanced security for sensitive operations

---

## 📦 Deployment

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure for your project
eas build:configure

# Build for app stores
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Environment-Specific Builds
- **Development**: Local development with Expo Go
- **Preview**: Internal testing builds
- **Production**: App store distribution

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Follow the existing code style (Prettier + ESLint configured)
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

### Code Style Guidelines
- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful component and variable names
- Add comments for complex business logic
- Maintain consistent file structure

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- 📧 **Email**: support@bricollano.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/aminemanssouri/theApp/issues)
- 📖 **Documentation**: This README + inline code comments

---

<div align="center">
  <p>Built with ❤️ by the BRICOLLANO Team</p>
  <p>© 2024 BRICOLLANO. All rights reserved.</p>
</div>
