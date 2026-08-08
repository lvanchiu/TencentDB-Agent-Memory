import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Card,
  Button,
  Tag,
  Copy,
  Text,
  Justify,
  H3,
  Form,
  Input,
  Modal,
} from 'tea-component';
import { AddIcon } from 'tea-icons-react';
import { usersApi, type CreateUserResult } from '@/lib/api/users';
import type { PublicUser } from '@/lib/api/types';
import { tea } from '@/lib/tea-bridge';
import { getErrorMessage } from '@/lib/error-message';
import './user-panel.css';

const { autotip } = Table.addons;

export default function UserPanel({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [createdResult, setCreatedResult] = useState<CreateUserResult | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await usersApi.list();
      setUsers(list);
    } catch (e) {
      tea.notify.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async (user: PublicUser) => {
    const ok = await tea.confirm({
      message: t('users.delete.confirm', { name: user.username }),
      description: t('users.delete.desc', { id: user.user_id }),
    });
    if (!ok) return;
    try {
      await usersApi.delete(user.user_id);
      tea.notify.success(t('users.delete.success'));
      refresh();
    } catch (e) {
      tea.notify.error(getErrorMessage(e));
    }
  };

  const columns = [
    { key: 'username', header: t('users.col.username'), render: (u: PublicUser) => u.username },
    { key: 'user_id', header: t('users.col.userId'), render: (u: PublicUser) => <Text copyable>{u.user_id}</Text> },
    {
      key: 'user_type', header: t('users.col.type'),
      render: (u: PublicUser) => (
        <Tag theme={u.user_type === 'system_admin' ? 'warning' : 'default'}>
          {u.user_type === 'system_admin' ? t('users.type.admin') : t('users.type.user')}
        </Tag>
      ),
    },
    {
      key: 'status', header: t('users.col.status'),
      render: (u: PublicUser) => (
        <Tag theme={u.status === 'active' ? 'success' : 'default'}>{u.status === 'active' ? t('users.status.active') : t('users.status.inactive')}</Tag>
      ),
    },
    { key: 'created_at', header: t('users.col.createdAt'), render: (u: PublicUser) => u.created_at?.slice(0, 10) },
    {
      key: 'ops', header: t('users.col.ops'),
      render: (u: PublicUser) => (
        <>
          <Button type="text" onClick={() => setEditingUser(u)}>{t('common.edit')}</Button>
          {u.user_type !== 'system_admin' && (
            <Button type="text" onClick={() => handleDelete(u)}>{t('common.delete')}</Button>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="_memory-user-panel">
      <Card>
        <Card.Body>
          <Justify
            left={<H3>{t('users.title')}</H3>}
            right={
              isAdmin && (
                <Button type="primary" onClick={() => setShowCreate(true)}>
                  <AddIcon size={14} /> {t('users.create')}
                </Button>
              )
            }
          />
          <Table
            records={users}
            recordKey="user_id"
            columns={columns}
            addons={[autotip({ isLoading: loading, emptyText: t('users.empty') })]}
          />
        </Card.Body>
      </Card>

      {/* Create user modal */}
      <CreateUserModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={(result) => {
          setShowCreate(false);
          setCreatedResult(result);
          refresh();
        }}
      />

      {/* Edit user modal */}
      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          setEditingUser(null);
          refresh();
        }}
      />

      {/* Show created user key */}
      {createdResult && (
        <Modal visible caption={t('users.created.title')} onClose={() => setCreatedResult(null)}>
          <Modal.Body>
            <p>{t('users.created.desc')}</p>
            <div className="_memory-user-key-display">
              <Copy text={createdResult.default_user_key}>
                <Text className="_memory-user-key-text">{createdResult.default_user_key}</Text>
              </Copy>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="primary" onClick={() => setCreatedResult(null)}>{t('common.confirm')}</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

function CreateUserModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: (r: CreateUserResult) => void;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim()) return;
    setSubmitting(true);
    try {
      const result = await usersApi.create({
        username: username.trim(),
        auth_provider: 'user_key',
        external_id: username.trim(),
        display_name: displayName.trim() || undefined,
      });
      onSuccess(result);
      setUsername('');
      setDisplayName('');
    } catch (e) {
      tea.notify.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} caption={t('users.create')} onClose={onClose}>
      <Modal.Body>
        <Form>
          <Form.Item label={t('users.form.username')} required>
            <Input value={username} onChange={(v) => setUsername(v)} placeholder={t('users.form.usernamePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('users.form.displayName')}>
            <Input value={displayName} onChange={(v) => setDisplayName(v)} />
          </Form.Item>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button type="primary" onClick={handleSubmit} disabled={!username.trim()} loading={submitting}>
          {t('common.confirm')}
        </Button>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </Modal.Footer>
    </Modal>
  );
}

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: PublicUser | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username ?? '');
      setDisplayName(user.display_name ?? '');
      setEmail(user.email ?? '');
      setStatus(user.status === 'inactive' ? 'inactive' : 'active');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !username.trim()) return;
    setSubmitting(true);
    try {
      await usersApi.update(user.user_id, {
        username: username.trim(),
        display_name: displayName.trim() || null,
        email: email.trim() || null,
        status,
      });
      tea.notify.success(t('users.update.success'));
      onSuccess();
    } catch (e) {
      tea.notify.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={!!user} caption={t('users.edit')} onClose={onClose}>
      <Modal.Body>
        <Form>
          <Form.Item label={t('users.form.username')} required>
            <Input value={username} onChange={(v) => setUsername(v)} />
          </Form.Item>
          <Form.Item label={t('users.form.displayName')}>
            <Input value={displayName} onChange={(v) => setDisplayName(v)} />
          </Form.Item>
          <Form.Item label={t('users.form.email')}>
            <Input value={email} onChange={(v) => setEmail(v)} />
          </Form.Item>
          <Form.Item label={t('users.col.status')}>
            <Button type={status === 'active' ? 'primary' : 'weak'} onClick={() => setStatus('active')}>{t('users.status.active')}</Button>
            {' '}
            <Button type={status === 'inactive' ? 'primary' : 'weak'} onClick={() => setStatus('inactive')}>{t('users.status.inactive')}</Button>
          </Form.Item>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button type="primary" onClick={handleSubmit} disabled={!username.trim()} loading={submitting}>
          {t('common.save')}
        </Button>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </Modal.Footer>
    </Modal>
  );
}
