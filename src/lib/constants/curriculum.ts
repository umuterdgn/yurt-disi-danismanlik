/**
 * Sabit Müfredat (Hardcoded Curriculum)
 * 
 * Bu dosya MEB müfredatına göre tanımlanmış konuları içerir.
 * OCR ve analiz motorları SADECE bu listedeki konuları kabul eder.
 * Listedeki isimle eşleşmeyen hiçbir konu veritabanına kaydedilmez.
 * 
 * Bu listeyi güncellemek için:
 * 1. Sınıf anahtarını (örn: "12. Sınıf") kullanın
 * 2. Ders anahtarını (örn: "Matematik") kullanın
 * 3. Konu dizisine resmi MEB konu adlarını ekleyin
 */

export const CURRICULUM: Record<string, Record<string, string[]>> = {
  "12. Sınıf": {
    "Matematik": [
      "Türev",
      "İntegral"
    ],
    "Türkçe": [],
    "Fen Bilimleri": [],
    "Sosyal Bilimler": []
  },
  "11. Sınıf": {
    "Matematik": [],
    "Türkçe": [],
    "Fen Bilimleri": [],
    "Sosyal Bilimler": []
  },
  "10. Sınıf": {
    "Matematik": [],
    "Türkçe": [],
    "Fen Bilimleri": [],
    "Sosyal Bilimler": []
  },
  "9. Sınıf": {
    "Matematik": [],
    "Türkçe": [],
    "Fen Bilimleri": [],
    "Sosyal Bilimler": []
  }
};

/**
 * Bir konunun müfredatta olup olmadığını kontrol eder
 * @param gradeLevel - Sınıf seviyesi (örn: "12. Sınıf")
 * @param subject - Ders adı (örn: "Matematik")
 * @param topic - Konu adı (örn: "Türev")
 * @returns true if topic is in curriculum, false otherwise
 */
export function isTopicInCurriculum(
  gradeLevel: string,
  subject: string,
  topic: string
): boolean {
  const grade = CURRICULUM[gradeLevel];
  if (!grade) return false;

  const subjectTopics = grade[subject];
  if (!subjectTopics) return false;

  return subjectTopics.includes(topic);
}

/**
 * Normalized string comparison for topic matching
 * Case-insensitive and trims whitespace
 */
export function normalizeTopicName(topic: string): string {
  return topic.trim().toLowerCase();
}

/**
 * Tüm müfredat konularını düz bir liste olarak döndürür
 */
export function getAllTopics(): string[] {
  const allTopics: string[] = [];
  for (const grade in CURRICULUM) {
    for (const subject in CURRICULUM[grade]) {
      allTopics.push(...CURRICULUM[grade][subject]);
    }
  }
  return allTopics;
}
