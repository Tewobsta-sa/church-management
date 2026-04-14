import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Welcome back": "Welcome back",
      "Language": "Language",
      "English": "English",
      "Amharic": "Amharic",
      "Dashboard": "Dashboard",
      "Students": "Students",
      "Promotions": "Promotions",
      "Courses": "Courses",
      "Schedules": "Schedules",
      "Attendance": "Attendance",
      "Results": "Results",
      "Mezmur Ministry": "Mezmur Ministry",
      "Admin": "Admin",
      "Logs": "Logs",
      "Settings": "Settings",
      "Profile": "Profile",
      "Sign Out": "Sign Out",
      "System & Users": "System & Users",
      "Register User": "Register User",
      "User Accounts": "User Accounts",
      "System Activity Logs": "System Activity Logs",
      "Role": "Role",
      "Actions": "Actions",
      "Search by name or username...": "Search by name or username...",
      "Students Explorer": "Students Explorer",
      "Manage enrollments for young program": "Manage enrollments for young program",
      "Academic Promotion": "Academic Promotion",
      "Commit Promotions": "Commit Promotions",
      "Academic Curriculum": "Academic Curriculum",
      "Manage young program courses": "Manage young program courses",
      "Schedule & Tasks": "Schedule & Tasks",
      "Live Attendance": "Live Attendance",
      "Academic Results": "Academic Results",
      "Reset Password": "Reset Password",
      "Forgot password?": "Forgot password?",
      "Back to login": "Back to login"
    }
  },
  am: {
    translation: {
      "Welcome back": "እንኳን ደህና መጡ",
      "Language": "ቋንቋ",
      "English": "English",
      "Amharic": "አማርኛ",
      "Dashboard": "ዳሽቦርድ",
      "Students": "ተማሪዎች",
      "Promotions": "እድገት",
      "Courses": "ትምህርቶች",
      "Schedules": "መርሃ ግብሮች",
      "Attendance": "ክትትል",
      "Results": "ውጤቶች",
      "Mezmur Ministry": "መዝሙር ክፍል",
      "Admin": "አስተዳዳሪ",
      "Logs": "የስርዓት መዝገብ",
      "Settings": "ቅንብሮች",
      "Profile": "መገለጫ",
      "Sign Out": "ውጣ",
      "System & Users": "ስርዓት እና ተጠቃሚዎች",
      "Register User": "ተጠቃሚ መመዝገብ",
      "User Accounts": "የተጠቃሚ መለያዎች",
      "System Activity Logs": "የስርዓት እንቅስቃሴ መዝገቦች",
      "Role": "ሚና",
      "Actions": "እርምጃዎች",
      "Search by name or username...": "በስም ወይም ተጠቃሚ ስም ፈልግ...",
      "Students Explorer": "የተማሪ መረጃ",
      "Manage enrollments for young program": "የወጣቶች ፕሮግራም ምዝገባን ያስተዳድሩ",
      "Academic Promotion": "አካዳሚያዊ እድገት",
      "Commit Promotions": "እድገት አስፈጽም",
      "Academic Curriculum": "የትምህርት አውታር",
      "Manage young program courses": "የወጣት ፕሮግራም ኮርሶችን ያስተዳድሩ",
      "Schedule & Tasks": "መርሃ ግብር እና ስራዎች",
      "Live Attendance": "ቀጥታ ክትትል",
      "Academic Results": "አካዳሚያዊ ውጤቶች",
      "Reset Password": "የይለፍ ቃል ቀይር",
      "Forgot password?": "የይለፍ ቃል ረሳህ?",
      "Back to login": "ወደ መግቢያ ተመለስ"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("lang") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

i18n.on("languageChanged", (lng) => localStorage.setItem("lang", lng));

export default i18n;
