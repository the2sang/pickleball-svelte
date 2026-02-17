const DEFAULT_MESSAGES = {
  COURT_NOT_FOUND: '코트를 찾을 수 없습니다.',
  RESERVATION_NOT_FOUND: '예약을 찾을 수 없습니다.',
  MEMBER_NOT_FOUND: '회원을 찾을 수 없습니다.',
  PARTNER_NOT_FOUND: '사업장을 찾을 수 없습니다.',

  INVALID_TIME_SLOT: '유효하지 않은 시간대입니다.',
  INVALID_REQUEST_STATE: '요청 상태가 올바르지 않습니다',
  TERMS_REQUIRED: '필수 약관에 동의해야 가입할 수 있습니다',
  RENTAL_NOT_ALLOWED: '일반 회원은 대관 시간대를 예약할 수 없습니다.',
  GAME_TIME_PASSED: '이미 지난 시간대는 예약할 수 없습니다.',
  CANCEL_DEADLINE_PASSED: '게임 개시 2시간 전 이후에는 취소할 수 없습니다.',
  COURT_CLOSED: '예약 마감된 코트입니다.',
  NOT_OWNER: '본인의 예약만 취소할 수 있습니다.',
  MEMBER_SUSPENDED: '해당 사업장에서 정지된 회원입니다.',
  VOTE_REJECTED: '기존 예약자의 과반 거부 투표로 제한됩니다.',
  FAVORITE_MEMBER_ONLY: '일반 회원만 즐겨찾기를 설정할 수 있습니다.',

  ALREADY_RESERVED: '이미 예약한 시간대입니다.',
  COURT_FULL: '해당 시간대 정원이 마감되었습니다.',
  FAVORITE_LIMIT_EXCEEDED: '즐겨찾기는 최대 6개까지 설정할 수 있습니다.',

  USERNAME_EXISTS: '이미 사용 중인 아이디입니다.',
  SCHEDULE_OVERLAP: '시간대가 겹치는 스케줄이 있습니다',

  INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다',
  USERNAME_NOT_REGISTERED: '등록된 아이디가 없으니 확인 바랍니다.',
  LOGIN_HELP_SENT_PASSWORD: '비밀번호가 5회 일치하지 않습니다. 패스워드 초기화를 진행해주세요.',
  REGISTERED_EMAIL_MISMATCH: '회원가입시 등록한 메일 주소와 다릅니다',
  PASSWORD_RESET_NOT_ALLOWED: '비밀번호가 5회 이상 일치하지 않은 경우에만 초기화할 수 있습니다.',
  CURRENT_PASSWORD_INVALID: '현재 비밀번호가 올바르지 않습니다.',
  NEW_PASSWORD_CONFIRM_MISMATCH: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
  NEW_PASSWORD_RULE_INVALID: '비밀번호는 영문자, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.',
  SAME_AS_OLD_PASSWORD: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
  ACCESS_DENIED: '접근 권한이 없습니다',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
  INTERNAL_ERROR: '서버 내부 오류가 발생했습니다',
};

export async function parseApiErrorResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  const code = data?.code ? String(data.code) : '';
  const serverMessage = data?.message ? String(data.message) : '';

  const fallback = DEFAULT_MESSAGES[code] || serverMessage || `요청에 실패했습니다. (HTTP ${res.status})`;
  return {
    code,
    message: fallback,
    status: res.status,
    raw: data,
  };
}
