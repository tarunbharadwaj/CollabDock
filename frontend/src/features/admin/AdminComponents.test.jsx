import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminConfirmModal, AdminStatus } from './AdminComponents';

describe('admin interface safeguards', () => {
  it('renders the account status with a normalized style hook', () => {
    render(<AdminStatus value="Deletion Pending"/>);
    expect(screen.getByText('Deletion Pending')).toHaveClass('admin-status-deletion-pending');
  });

  it('keeps a destructive action disabled until reason and typed confirmation match', () => {
    const confirm = vi.fn();
    render(<AdminConfirmModal open onClose={() => {}} title="Delete creator" description="Permanent action" actionLabel="Delete creator" expectedConfirmation="creator@example.com" confirmationLabel="Type email" onConfirm={confirm}/>);
    const action = screen.getByRole('button', { name: 'Delete creator' });
    expect(action).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Explain why this change is required'), { target: { value: 'Account owner requested deletion' } });
    fireEvent.change(screen.getByLabelText('Type email'), { target: { value: 'creator@example.com' } });
    expect(action).toBeEnabled();
    fireEvent.click(action);
    expect(confirm).toHaveBeenCalledWith({ reason: 'Account owner requested deletion', confirmation: 'creator@example.com' });
  });
});
