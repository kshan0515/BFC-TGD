export interface Match {
  id: string;
  date: string; // ISO string
  location: string;
  opponent: string;
  isHome: boolean;
  venue: string;
}

export const MATCH_DATA: Match[] = [
  { id: "1", date: "2026-08-08T10:30:00Z", location: "부천종합운동장", opponent: "광주", isHome: true, venue: "부천종합운동장" },
  { id: "2", date: "2026-07-04T10:30:00Z", location: "대전월드컵경기장", opponent: "대전", isHome: false, venue: "대전월드컵경기장" },
  { id: "3", date: "2026-08-22T10:30:00Z", location: "포항스틸야드", opponent: "포항", isHome: false, venue: "포항스틸야드" },
  { id: "4", date: "2026-07-11T10:30:00Z", location: "김천종합운동장", opponent: "김천", isHome: false, venue: "김천종합운동장" },
  { id: "5", date: "2026-05-05T05:00:00Z", location: "부천종합운동장", opponent: "SK", isHome: true, venue: "부천종합운동장" },
  { id: "6", date: "2026-09-05T10:00:00Z", location: "부천종합운동장", opponent: "대전", isHome: true, venue: "부천종합운동장" },
  { id: "7", date: "2026-03-07T07:30:00Z", location: "부천종합운동장", opponent: "대전", isHome: true, venue: "부천종합운동장" },
  { id: "8", date: "2026-04-04T05:00:00Z", location: "제주월드컵경기장", opponent: "SK", isHome: false, venue: "제주월드컵경기장" },
  { id: "9", date: "2026-04-18T07:30:00Z", location: "부천종합운동장", opponent: "인천", isHome: true, venue: "부천종합운동장" },
  { id: "10", date: "2026-03-15T05:00:00Z", location: "부천종합운동장", opponent: "울산", isHome: true, venue: "부천종합운동장" },
  { id: "11", date: "2026-10-17T07:30:00Z", location: "울산 문수축구경기장", opponent: "울산", isHome: false, venue: "울산 문수축구경기장" },
  { id: "12", date: "2026-09-12T07:30:00Z", location: "부천종합운동장", opponent: "SK", isHome: true, venue: "부천종합운동장" },
  { id: "13", date: "2026-04-25T07:30:00Z", location: "부천종합운동장", opponent: "김천", isHome: true, venue: "부천종합운동장" },
  { id: "14", date: "2026-05-10T05:00:00Z", location: "울산 문수축구경기장", opponent: "울산", isHome: false, venue: "울산 문수축구경기장" },
  { id: "15", date: "2026-03-01T05:00:00Z", location: "전주월드컵경기장", opponent: "전북", isHome: false, venue: "전주월드컵경기장" },
  { id: "16", date: "2026-03-18T10:30:00Z", location: "부천종합운동장", opponent: "강원", isHome: true, venue: "부천종합운동장" },
  { id: "17", date: "2026-04-11T07:30:00Z", location: "광주월드컵경기장", opponent: "광주", isHome: false, venue: "광주월드컵경기장" },
  { id: "18", date: "2026-09-08T10:30:00Z", location: "인천축구전용경기장", opponent: "인천", isHome: false, venue: "인천축구전용경기장" },
  { id: "19", date: "2026-05-02T10:00:00Z", location: "안양종합운동장", opponent: "안양", isHome: false, venue: "안양종합운동장" },
  { id: "20", date: "2026-05-13T10:30:00Z", location: "부천종합운동장", opponent: "전북", isHome: true, venue: "부천종합운동장" },
  { id: "21", date: "2026-07-26T10:30:00Z", location: "인천축구전용경기장", opponent: "인천", isHome: false, venue: "인천축구전용경기장" },
  { id: "22", date: "2026-09-19T07:30:00Z", location: "부천종합운동장", opponent: "김천", isHome: true, venue: "부천종합운동장" },
  { id: "23", date: "2026-08-25T10:30:00Z", location: "서울월드컵경기장", opponent: "GS", isHome: false, venue: "서울월드컵경기장" },
  { id: "24", date: "2026-10-24T05:00:00Z", location: "부천종합운동장", opponent: "광주", isHome: true, venue: "부천종합운동장" },
  { id: "25", date: "2026-08-29T10:30:00Z", location: "부천종합운동장", opponent: "안양", isHome: true, venue: "부천종합운동장" },
  { id: "26", date: "2026-05-17T10:00:00Z", location: "부천종합운동장", opponent: "포항", isHome: true, venue: "부천종합운동장" },
  { id: "27", date: "2026-04-21T10:30:00Z", location: "서울월드컵경기장", opponent: "GS", isHome: false, venue: "서울월드컵경기장" },
  { id: "28", date: "2026-08-16T10:30:00Z", location: "부천종합운동장", opponent: "전북", isHome: true, venue: "부천종합운동장" },
  { id: "29", date: "2026-03-22T07:30:00Z", location: "포항스틸야드", opponent: "포항", isHome: false, venue: "포항스틸야드" },
  { id: "30", date: "2026-10-09T07:30:00Z", location: "강릉종합운동장", opponent: "강원", isHome: false, venue: "강릉종합운동장" },
  { id: "31", date: "2026-07-22T10:30:00Z", location: "부천종합운동장", opponent: "안양", isHome: true, venue: "부천종합운동장" },
  { id: "32", date: "2026-08-01T10:30:00Z", location: "강릉종합운동장", opponent: "강원", isHome: false, venue: "강릉종합운동장" },
  { id: "33", date: "2026-07-19T10:30:00Z", location: "부천종합운동장", opponent: "GS", isHome: true, venue: "부천종합운동장" },
].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
