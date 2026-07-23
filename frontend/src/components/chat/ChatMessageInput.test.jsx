import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessageInput } from './ChatMessageInput';
import * as schedulesApi from '../../api/schedules.api';

vi.mock('../../api/schedules.api');

describe('ChatMessageInput — BR-05 일반/변경요청 명시적 선택 (§4.1 필수 RTL 테스트)', () => {
  let onSend;

  beforeEach(() => {
    vi.clearAllMocks();
    onSend = vi.fn().mockResolvedValue();
    schedulesApi.getSchedules.mockResolvedValue([
      { id: 10, title: '팀 회의' },
      { id: 11, title: '워크숍' },
    ]);
  });

  it('전송 유형을 선택하지 않으면 전송이 차단됨(기본 선택값 없음)', async () => {
    const user = userEvent.setup();
    render(<ChatMessageInput teamId="5" date="2026-07-15" onSend={onSend} />);

    await user.type(screen.getByLabelText('메시지'), '안녕하세요');
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText('전송 유형을 선택해주세요.')).toBeInTheDocument();
  });

  it("[일반 메시지]에 '일정','변경' 단어가 포함되어도 요청 관련 필드 없이 type='general'로만 전송됨(BR-05, SC-06 7단계)", async () => {
    const user = userEvent.setup();
    render(<ChatMessageInput teamId="5" date="2026-07-15" onSend={onSend} />);

    await user.click(screen.getByRole('radio', { name: '일반 메시지' }));
    await user.type(
      screen.getByLabelText('메시지'),
      '저도 그날 일정 변경 없이 참석 가능합니다'
    );
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(onSend).toHaveBeenCalledTimes(1);
    const payload = onSend.mock.calls[0][0];
    expect(payload.type).toBe('general');
    expect(payload).not.toHaveProperty('request_type');
    expect(payload).not.toHaveProperty('target_schedule_id');
  });

  it('[변경 요청] 선택 후 요청 유형+대상 일정을 채워 전송하면 메시지+요청 정보가 함께 전송됨(SC-06)', async () => {
    const user = userEvent.setup();
    render(<ChatMessageInput teamId="5" date="2026-07-15" onSend={onSend} />);

    await user.click(screen.getByRole('radio', { name: '변경 요청' }));
    await user.type(screen.getByLabelText('메시지'), '회의를 1시간 뒤로 옮겨주세요');
    await user.selectOptions(await screen.findByLabelText('요청 유형'), '수정');
    await user.selectOptions(await screen.findByLabelText('대상 일정'), '팀 회의');
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(onSend).toHaveBeenCalledWith({
      type: 'change_request',
      content: '회의를 1시간 뒤로 옮겨주세요',
      request_type: 'update',
      target_schedule_id: 10,
    });
  });

  it("[변경 요청]인데 요청 유형을 선택하지 않으면 전송이 차단됨", async () => {
    const user = userEvent.setup();
    render(<ChatMessageInput teamId="5" date="2026-07-15" onSend={onSend} />);

    await user.click(screen.getByRole('radio', { name: '변경 요청' }));
    await user.type(screen.getByLabelText('메시지'), '일정 변경 요청합니다');
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText('요청 유형을 선택해주세요.')).toBeInTheDocument();
  });

  it("요청 유형이 '수정'인데 대상 일정을 선택하지 않으면 전송이 차단됨", async () => {
    const user = userEvent.setup();
    render(<ChatMessageInput teamId="5" date="2026-07-15" onSend={onSend} />);

    await user.click(screen.getByRole('radio', { name: '변경 요청' }));
    await user.type(screen.getByLabelText('메시지'), '일정을 옮겨주세요');
    await user.selectOptions(await screen.findByLabelText('요청 유형'), '수정');
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText('대상 일정을 선택해주세요.')).toBeInTheDocument();
  });

  it("요청 유형이 '신규'이면 대상 일정 선택 없이도 전송 가능함(target_schedule_id 불필요)", async () => {
    const user = userEvent.setup();
    render(<ChatMessageInput teamId="5" date="2026-07-15" onSend={onSend} />);

    await user.click(screen.getByRole('radio', { name: '변경 요청' }));
    await user.type(screen.getByLabelText('메시지'), '새 일정을 추가해주세요');
    await user.selectOptions(await screen.findByLabelText('요청 유형'), '신규');
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(onSend).toHaveBeenCalledWith({
      type: 'change_request',
      content: '새 일정을 추가해주세요',
      request_type: 'create',
    });
  });

  it('본문이 500자를 초과하면 전송이 차단됨(§8)', async () => {
    const user = userEvent.setup();
    render(<ChatMessageInput teamId="5" date="2026-07-15" onSend={onSend} />);

    await user.click(screen.getByRole('radio', { name: '일반 메시지' }));
    const input = screen.getByLabelText('메시지');
    fireLongText(input, 501);
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(onSend).not.toHaveBeenCalled();
    expect(
      screen.getByText('메시지는 1자 이상 500자 이하로 입력해주세요.')
    ).toBeInTheDocument();
  });
});

function fireLongText(input, length) {
  const value = 'a'.repeat(length);
  input.dispatchEvent(new Event('focus'));
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(
    input,
    value
  );
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
