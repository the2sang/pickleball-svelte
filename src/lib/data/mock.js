export const MOCK_PARTNERS = [
  { id: 1, name: '서울 피클볼 아레나', address: '서울시 강남구 삼성동 123', phone: '02-1234-5678' },
  { id: 2, name: '인천 피클볼 센터', address: '인천시 연수구 송도동 45', phone: '032-987-6543' },
  { id: 3, name: '부산 해운대 피클볼', address: '부산시 해운대구 우동 78', phone: '051-555-1234' }
];

export const MOCK_COURTS = [
  { id: 1, partnerId: 1, name: 'A코트', level: '중급', capacity: 6, type: '일반' },
  { id: 2, partnerId: 1, name: 'B코트', level: '초급', capacity: 6, type: '일반' },
  { id: 3, partnerId: 1, name: 'C코트', level: '상급', capacity: 4, type: '일반' },
  { id: 4, partnerId: 2, name: '1코트', level: '중급', capacity: 6, type: '일반' },
  { id: 5, partnerId: 2, name: '2코트', level: '초급', capacity: 6, type: '일반' },
  { id: 6, partnerId: 3, name: '메인코트', level: '상급', capacity: 4, type: '일반' }
];

export const TIME_SLOTS = [
  '06:00~08:00', '08:00~10:00', '10:00~12:00',
  '12:00~14:00', '14:00~16:00', '16:00~18:00',
  '18:00~20:00', '20:00~22:00'
];

export const LEVEL_COLORS = {
  '초급': { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  '중급': { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  '상급': { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' }
};

export const MOCK_RESERVATIONS = [
  { courtId: 1, timeSlot: '08:00~10:00', date: '2026-02-10', players: [
    { name: '김피클', level: '중급', dupr: '3.5', sex: '남' },
    { name: '이볼러', level: '중급', dupr: '3.8', sex: '여' },
    { name: '박스매시', level: '중상급', dupr: '4.0', sex: '남' }
  ]},
  { courtId: 1, timeSlot: '10:00~12:00', date: '2026-02-10', players: [
    { name: '최드라이브', level: '상급', dupr: '4.5', sex: '남' },
    { name: '정딩크', level: '중상급', dupr: '4.2', sex: '여' }
  ]},
  { courtId: 2, timeSlot: '08:00~10:00', date: '2026-02-10', players: [
    { name: '윤서브', level: '초급', dupr: '2.5', sex: '남' }
  ]},
  { courtId: 4, timeSlot: '14:00~16:00', date: '2026-02-10', players: [
    { name: '한발리', level: '중급', dupr: '3.2', sex: '여' },
    { name: '강로브', level: '중급', dupr: '3.3', sex: '남' },
    { name: '조스핀', level: '중급', dupr: '3.5', sex: '여' },
    { name: '임푸시', level: '중급', dupr: '3.1', sex: '남' },
    { name: '송드롭', level: '초중급', dupr: '3.0', sex: '여' },
    { name: '오킬러', level: '중급', dupr: '3.6', sex: '남' }
  ]},
  { courtId: 1, timeSlot: '14:00~16:00', date: '2026-02-11', players: [
    { name: '정딩크', level: '중상급', dupr: '4.2', sex: '여' }
  ]},
  { courtId: 6, timeSlot: '18:00~20:00', date: '2026-02-10', players: [
    { name: '최드라이브', level: '상급', dupr: '4.5', sex: '남' },
    { name: '김에이스', level: '상급', dupr: '4.8', sex: '남' }
  ]}
];

/**
 * @returns {{ value: string, label: string, isToday: boolean }[]}
 */
export function getNext7Days() {
  const days = [];
  const base = new Date(); // Use current date instead of hardcoded date
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({
      value: `${d.getFullYear()}-${mm}-${dd}`,
      label: `${mm}/${dd} (${weekdays[d.getDay()]})`,
      isToday: i === 0
    });
  }
  return days;
}

/**
 * @param {number} courtId
 * @param {string} timeSlot
 * @param {string} date
 */
export function getReservation(courtId, timeSlot, date) {
  return MOCK_RESERVATIONS.find(
    (r) => r.courtId === courtId && r.timeSlot === timeSlot && r.date === date
  );
}

/**
 * @param {{ id: number, capacity: number }} court
 * @param {string} timeSlot
 * @param {string} date
 */
export function getSlotStatus(court, timeSlot, date) {
  const res = getReservation(court.id, timeSlot, date);
  if (!res) return { status: 'open', count: 0, capacity: court.capacity };
  if (res.players.length >= court.capacity)
    return { status: 'full', count: res.players.length, capacity: court.capacity };
  return { status: 'available', count: res.players.length, capacity: court.capacity };
}
