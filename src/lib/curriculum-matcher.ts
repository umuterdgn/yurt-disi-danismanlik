import { prisma } from './prisma';
import { CURRICULUM, isTopicInCurriculum, normalizeTopicName } from './constants/curriculum';

interface SubjectMatch {
  id: string;
  name: string;
  code: string;
}

interface TopicMatch {
  id: string;
  name: string;
  code: string;
  subjectId: string;
}

// Get official subjects from curriculum for a given exam type or grade level
export async function getOfficialSubjects(examType: string): Promise<SubjectMatch[]> {
  // Try to find by exam type first, then by grade level
  let gradeLevelRecord = await prisma.gradeLevel.findUnique({
    where: { name: examType },
    include: {
      subjects: {
        where: { isActive: true },
        orderBy: { order: 'asc' }
      }
    }
  });

  // If not found by exam type, try as grade level
  if (!gradeLevelRecord) {
    gradeLevelRecord = await prisma.gradeLevel.findFirst({
      where: { 
        OR: [
          { name: examType },
          { name: { contains: examType } }
        ]
      },
      include: {
        subjects: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });
  }

  if (!gradeLevelRecord) {
    console.warn(`No grade level found for exam type: ${examType}`);
    return [];
  }

  return gradeLevelRecord.subjects.map(subject => ({
    id: subject.id,
    name: subject.name,
    code: subject.code || ''
  }));
}

// Get official topics from curriculum for a given subject
export async function getOfficialTopics(subjectId: string): Promise<TopicMatch[]> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      topics: {
        where: { isActive: true },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!subject) {
    return [];
  }

  return subject.topics.map(topic => ({
    id: topic.id,
    name: topic.name,
    code: topic.code || '',
    subjectId: topic.subjectId
  }));
}

// Match OCR subject output to official curriculum subjects
export function matchSubjectToCurriculum(
  ocrSubject: string,
  officialSubjects: SubjectMatch[]
): SubjectMatch | null {
  if (!ocrSubject) return null;

  // Normalize the OCR subject name
  const normalizedOCR = ocrSubject.toLowerCase().trim();
  
  // Direct match
  const directMatch = officialSubjects.find(
    subject => subject.name.toLowerCase() === normalizedOCR
  );
  if (directMatch) return directMatch;

  // Code match
  const codeMatch = officialSubjects.find(
    subject => subject.code?.toLowerCase() === normalizedOCR
  );
  if (codeMatch) return codeMatch;

  // Fuzzy match for common variations
  const subjectVariations: Record<string, string[]> = {
    'türkçe': ['türkçe', 'turkish', 'tr', 'türk dili', 'edebiyat'],
    'matematik': ['matematik', 'math', 'mat', 'mathematics'],
    'fizik': ['fizik', 'physics', 'fzk'],
    'kimya': ['kimya', 'chemistry', 'kmy'],
    'biyoloji': ['biyoloji', 'biology', 'byo'],
    'tarih': ['tarih', 'history', 'trh'],
    'coğrafya': ['coğrafya', 'geography', 'cgf'],
    'felsefe': ['felsefe', 'philosophy'],
    'edebiyat': ['edebiyat', 'literature']
  };

  for (const [officialName, variations] of Object.entries(subjectVariations)) {
    if (variations.includes(normalizedOCR)) {
      const match = officialSubjects.find(subject => 
        subject.name.toLowerCase() === officialName
      );
      if (match) return match;
    }
  }

  return null;
}

// Match OCR topic output to official curriculum topics
export function matchTopicToCurriculum(
  ocrTopic: string,
  officialTopics: TopicMatch[],
  examType: string = 'TYT',
  subject: string = 'Matematik'
): TopicMatch | null {
  if (!ocrTopic) return null;

  // Normalize the OCR topic name
  const normalizedOCR = normalizeTopicName(ocrTopic);
  
  // CRITICAL: Strict validation - Check if topic is in hardcoded curriculum first
  // Only accept topics that are officially defined in the curriculum
  if (!isTopicInCurriculum(examType, subject, ocrTopic)) {
    console.warn(`Topic "${ocrTopic}" not in curriculum for ${examType} ${subject} - rejecting`);
    return null;
  }
  
  // Direct match
  const directMatch = officialTopics.find(
    topic => normalizeTopicName(topic.name) === normalizedOCR
  );
  if (directMatch) return directMatch;

  // Code match
  const codeMatch = officialTopics.find(
    topic => topic.code ? normalizeTopicName(topic.code) === normalizedOCR : false
  );
  if (codeMatch) return codeMatch;

  // Fuzzy match for common variations (only if topic is in curriculum)
  const topicVariations: Record<string, string[]> = {
    'türev': ['türev', 'türev alma', 'türev hesaplama', 'derivative'],
    'integral': ['integral', 'integrasyon', 'integration'],
    'fonksiyon': ['fonksiyon', 'function', 'kavram fonksiyonu'],
    'polinom': ['polinom', 'polinomlar', 'polynomial'],
    'denklem': ['denklem', 'denklemler', 'equation'],
    'üslü sayılar': ['üslü sayılar', 'üslü', 'exponential'],
    'köklü sayılar': ['köklü sayılar', 'kök', 'radical'],
    'logaritma': ['logaritma', 'log', 'logarithm'],
    'trigonometri': ['trigonometri', 'trig', 'trigonometry'],
    'diziler': ['diziler', 'dizi', 'sequence'],
    'limit': ['limit', 'limit alma', 'limit teoremi'],
    'olasılık': ['olasılık', 'probability', 'ihtimal'],
    'istatistik': ['istatistik', 'statistics'],
    'paragraf': ['paragraf', 'paragraph'],
    'sözcük anlamı': ['sözcük anlamı', 'kelime anlamı', 'word meaning'],
    'cümle anlamı': ['cümle anlamı', 'sentence meaning'],
    'ses bilgisi': ['ses bilgisi', 'phonetics'],
    'yazım kuralları': ['yazım kuralları', 'spelling'],
    'noktalama': ['noktalama', 'punctuation'],
    'anlatım bozuklukları': ['anlatım bozuklukları', 'expression errors']
  };

  for (const [officialName, variations] of Object.entries(topicVariations)) {
    if (variations.includes(normalizedOCR)) {
      // Double-check that the official name is in curriculum
      if (isTopicInCurriculum(examType, subject, officialName)) {
        const match = officialTopics.find(topic => 
          normalizeTopicName(topic.name) === normalizeTopicName(officialName)
        );
        if (match) return match;
      }
    }
  }

  return null;
}

// Main function to match OCR results to curriculum
export async function matchOCRToCurriculum(
  ocrResults: any[],
  examType: string
): Promise<any[]> {
  const officialSubjects = await getOfficialSubjects(examType);
  
  // Build a map of subjectId to topics to avoid multiple queries
  const topicsMap = new Map<string, TopicMatch[]>();
  for (const subject of officialSubjects) {
    const topics = await getOfficialTopics(subject.id);
    topicsMap.set(subject.id, topics);
  }
  
  // Process all results synchronously since we have all the data
  const processedResults = ocrResults.map((result) => {
    const matchedSubject = matchSubjectToCurriculum(result.subject, officialSubjects);
    
    if (!matchedSubject) {
      // If no subject match, return result with null topic (don't make up topics)
      return {
        ...result,
        subject: null,
        topic: null,
        subtopic: null,
        curriculumMatched: false
      };
    }

    // Get official topics for the matched subject from the map
    const officialTopics = topicsMap.get(matchedSubject.id) || [];
    
    // Pass examType and subject name to enforce curriculum restrictions
    const matchedTopic = matchTopicToCurriculum(
      result.topic, 
      officialTopics,
      examType,
      matchedSubject.name
    );
    
    if (!matchedTopic) {
      // If no topic match, don't make up a topic
      return {
        ...result,
        subject: matchedSubject.name,
        subjectId: matchedSubject.id,
        topic: null,
        subtopic: null,
        curriculumMatched: false
      };
    }

    return {
      ...result,
      subject: matchedSubject.name,
      subjectId: matchedSubject.id,
      topic: matchedTopic.name,
      topicId: matchedTopic.id,
      subtopic: result.subtopic, // Keep subtopic as it's more flexible
      curriculumMatched: true
    };
  });

  return processedResults;
}