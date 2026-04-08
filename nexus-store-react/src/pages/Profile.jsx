import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Profile = ({ navigateTo }) => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || { street: '', city: '', state: '', zip: '' }
  });

  const handleLogout = async () => {
    await signOut();
    showToast('👋 Até logo!');
    navigateTo('login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const { error } = await updateProfile(formData);
    if (error) {
      showToast(`❌ Erro ao atualizar: ${error.message}`, 4000);
    } else {
      showToast('✅ Perfil atualizado com sucesso!');
      setIsEditing(false);
    }
  };

  if (!user) {
    navigateTo('login');
    return null;
  }

  return (
    <div className="page-profile">
      <div className="page-header">
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações pessoais</p>
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <span className="avatar-emoji">👤</span>
          </div>
          <h3>{profile?.full_name || user.email?.split('@')[0] || 'Usuário'}</h3>
          <p className="profile-email">{user.email}</p>
          <button className="btn-outline" onClick={handleLogout}>
            Sair da conta
          </button>
        </div>

        <div className="profile-content">
          {!isEditing ? (
            <div className="profile-info">
              <div className="info-header">
                <h3>Informações Pessoais</h3>
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  ✏️ Editar
                </button>
              </div>
              
              <div className="info-group">
                <label>Nome completo</label>
                <p>{profile?.full_name || 'Não informado'}</p>
              </div>
              
              <div className="info-group">
                <label>E-mail</label>
                <p>{user.email}</p>
              </div>
              
              <div className="info-group">
                <label>Telefone</label>
                <p>{profile?.phone || 'Não informado'}</p>
              </div>
              
              <div className="info-group">
                <label>Endereço</label>
                {profile?.address?.street ? (
                  <p>
                    {profile.address.street}, {profile.address.city} - {profile.address.state}, {profile.address.zip}
                  </p>
                ) : (
                  <p>Não informado</p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <h3>Editar Perfil</h3>
              
              <div className="form-group">
                <label>Nome completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="form-group">
                <label>Endereço - Rua</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, street: e.target.value } 
                  })}
                  placeholder="Rua, número, complemento"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, city: e.target.value } 
                    })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, state: e.target.value } 
                    })}
                    placeholder="UF"
                    maxLength="2"
                  />
                </div>
                <div className="form-group">
                  <label>CEP</label>
                  <input
                    type="text"
                    value={formData.address.zip}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, zip: e.target.value } 
                    })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar alterações
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;