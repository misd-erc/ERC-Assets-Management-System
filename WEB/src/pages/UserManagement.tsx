import React, { useState } from 'react';
import { UserList, UserFormModal, UserDetailsDrawer } from '../components/user-management';
import { User } from '../types/user';

const UserManagement: React.FC = () => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const handleAddUser = () => {
    setShowAddUser(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
  };

  const handleCloseModals = () => {
    setShowAddUser(false);
    setEditingUser(null);
    setViewingUser(null);
  };

  const handleSuccess = () => {
    // Refresh the user list - this will be handled by Qthe UserList component
    handleCloseModals();
  };

  return (
    <div className="space-y-8">
      <UserList
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onViewUser={handleViewUser}
      />

      <UserFormModal
        isOpen={showAddUser || !!editingUser}
        onClose={handleCloseModals}
        user={editingUser}
        onSuccess={handleSuccess}
      />

      <UserDetailsDrawer
        isOpen={!!viewingUser}
        onClose={handleCloseModals}
        user={viewingUser}
      />
    </div>
  );
};

export default UserManagement;

export {};
