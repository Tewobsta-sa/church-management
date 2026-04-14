import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// In a real application, you'd fetch these from separate JSON files or API
const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Students": "Students",
      "Courses": "Courses",
      "Schedules": "Schedules",
      "Attendance": "Attendance",
      "Results": "Results",
      "Mezmur Ministry": "Mezmur Ministry",
      "Admin": "Admin",
      "Users": "Users",
      "Logs": "Logs",
      "Settings": "Settings",
      "Profile": "Profile",
      "Logout": "Logout",
      "Language": "Language"
    }
  },
  am: {
    translation: {
      "Dashboard": "ዳሽቦርድ",
      "Students": "ተማሪዎች",
      "Courses": "ትምህርቶች",
      "Schedules": "መርሃ ግብሮች",
      "Attendance": "ክትትል",
      "Results": "ውጤቶች",
      "Mezmur Ministry": "መዝሙር ክፍል",
      "Admin": "አስተዳዳሪ",
      "Users": "ተጠቃሚዎች",
      "Logs": "የስርዓት መዝገብ",
      "Settings": "ቅንብሮች",
      "Profile": "መገለጫ",
      "Logout": "መውጣት",
      "Language": "ቋንቋ"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
