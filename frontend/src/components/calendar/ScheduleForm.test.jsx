import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleForm } from './ScheduleForm';

const MEMBERS = [
  { user_id: 1, email: 'leader@caltalk.local', role: 'leader' },
  { user_id: 2, email: 'member@caltalk.local', role: 'member' },
];

describe('ScheduleForm', () => {
  let onSave;
  let onDelete;
  let onClose;

  beforeEach(() => {
    onSave = vi.fn().mockResolvedValue();
    onDelete = vi.fn().mockResolvedValue();
    onClose = vi.fn();
  });

  it('제목이 공백이면 저장을 차단하고 오류를 표시함(§8)', async () => {
    const user = userEvent.setup();
    render(
      <ScheduleForm mode="create" members={MEMBERS} onSave={onSave} onClose={onClose} />
    );

    await user.type(screen.getByLabelText('제목'), '   ');
    await user.type(screen.getByLabelText('시작 일시'), '2026-08-01T14:00');
    await user.type(screen.getByLabelText('종료 일시'), '2026-08-01T15:00');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/공백만으로는 입력할 수 없습니다/)).toBeInTheDocument();
  });

  it('시작 일시가 종료 일시보다 앞서지 않으면 저장을 차단함(§8)', async () => {
    const user = userEvent.setup();
    render(
      <ScheduleForm mode="create" members={MEMBERS} onSave={onSave} onClose={onClose} />
    );

    await user.type(screen.getByLabelText('제목'), '팀 회의');
    await user.type(screen.getByLabelText('시작 일시'), '2026-08-01T15:00');
    await user.type(screen.getByLabelText('종료 일시'), '2026-08-01T14:00');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/시작 일시는 종료 일시보다 앞서야 합니다/)).toBeInTheDocument();
  });

  it('유효한 값으로 제출하면 onSave가 올바른 payload로 호출되고 폼이 닫힘(SC-02)', async () => {
    const user = userEvent.setup();
    render(
      <ScheduleForm mode="create" members={MEMBERS} onSave={onSave} onClose={onClose} />
    );

    await user.type(screen.getByLabelText('제목'), '팀 회의');
    await user.type(screen.getByLabelText('시작 일시'), '2026-08-01T14:00');
    await user.type(screen.getByLabelText('종료 일시'), '2026-08-01T15:00');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSave).toHaveBeenCalledWith({
      title: '팀 회의',
      start_at: '2026-08-01T14:00:00Z',
      end_at: '2026-08-01T15:00:00Z',
      target_type: 'all',
      target_member_id: null,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("대상을 '특정 팀원'으로 선택했는데 팀원을 고르지 않으면 저장을 차단함(§8 대상 단일 선택)", async () => {
    const user = userEvent.setup();
    render(
      <ScheduleForm mode="create" members={MEMBERS} onSave={onSave} onClose={onClose} />
    );

    await user.type(screen.getByLabelText('제목'), '팀 회의');
    await user.type(screen.getByLabelText('시작 일시'), '2026-08-01T14:00');
    await user.type(screen.getByLabelText('종료 일시'), '2026-08-01T15:00');
    await user.click(screen.getByRole('radio', { name: /특정 팀원 1명/ }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('대상 팀원을 선택해주세요.')).toBeInTheDocument();
  });

  it('수정 모드에서는 삭제 버튼이 노출되며 확인 후 onDelete가 호출됨(SC-03)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <ScheduleForm
        mode="edit"
        initialSchedule={{
          id: 10,
          title: '기존 일정',
          start_at: '2026-08-01T14:00:00.000Z',
          end_at: '2026-08-01T15:00:00.000Z',
          target_type: 'all',
          target_member_id: null,
        }}
        members={MEMBERS}
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('생성 모드에서는 삭제 버튼이 존재하지 않음', () => {
    render(
      <ScheduleForm mode="create" members={MEMBERS} onSave={onSave} onClose={onClose} />
    );

    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });
});
