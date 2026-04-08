import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";

const Profile = ({ navigateTo }) => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  // Adicione esta função temporariamente
  const testSave = async () => {
    console.log("Testando save...");
    const result = await updateProfile({ full_name: "Teste Nome" });
    console.log("Resultado:", result);
  };

  // Adicione este botão no JSX
  <button
    onClick={testSave}
    className="btn-primary"
    style={{ marginTop: "1rem" }}
  >
    Testar Save
  </button>;

  // Adicione esta função no Profile.jsx
  const forceCreateProfile = async () => {
    try {
      const { error } = await supabase.from("user_profiles").insert([
        {
          id: user.id,
          email: user.email,
          full_name: user.email.split("@")[0],
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Erro ao criar:", error);
        showToast("❌ Erro ao criar perfil", 3000);
      } else {
        showToast("✅ Perfil criado! Recarregue a página", 3000);
        // Recarregar a página
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  // Adicione este botão no JSX (temporariamente)
  <button onClick={forceCreateProfile} className="btn-primary">
    Criar Perfil (Admin)
  </button>;

  // Carregar dados do perfil quando ele mudar
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        street: profile.address?.street || "",
        city: profile.address?.city || "",
        state: profile.address?.state || "",
        zip: profile.address?.zip || "",
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    showToast("👋 Até logo!");
    navigateTo("login");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Construir o objeto address
      const addressObject = {};
      if (formData.street) addressObject.street = formData.street;
      if (formData.city) addressObject.city = formData.city;
      if (formData.state) addressObject.state = formData.state;
      if (formData.zip) addressObject.zip = formData.zip;

      // Construir o objeto de updates
      const updates = {};
      if (formData.full_name) updates.full_name = formData.full_name;
      if (formData.phone) updates.phone = formData.phone;
      if (Object.keys(addressObject).length > 0) {
        updates.address = addressObject;
      }

      if (Object.keys(updates).length === 0) {
        showToast("❌ Nenhuma informação para atualizar", 3000);
        setSaving(false);
        return;
      }

      console.log("Enviando updates:", updates);

      const { error, data } = await updateProfile(updates);

      if (error) {
        console.error("Erro detalhado:", error);
        showToast(`❌ Erro: ${error.message}`, 4000);
        setSaving(false);
        return;
      }

      console.log("Resposta do update:", data);

      showToast("✅ Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      console.error("Erro no catch:", error);
      showToast("❌ Erro ao atualizar perfil", 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      showToast("❌ Formato inválido. Use JPEG, PNG ou GIF", 3000);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("❌ Imagem deve ter no máximo 2MB", 3000);
      return;
    }

    setUploading(true);

    try {
      // Criar bucket se não existir
      try {
        await supabase.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 2097152,
        });
      } catch (bucketError) {
        console.log("Bucket já existe");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload da imagem
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Atualizar perfil com a nova URL
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      });

      if (updateError) throw updateError;

      showToast("✅ Foto de perfil atualizada!");
    } catch (error) {
      console.error("Erro:", error);
      showToast(`❌ Erro: ${error.message || "Falha no upload"}`, 4000);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    navigateTo("login");
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
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="avatar-img"
              />
            ) : (
              <div className="avatar-placeholder">
                <span className="avatar-emoji">👤</span>
              </div>
            )}
            <label
              className={`avatar-upload-btn ${uploading ? "uploading" : ""}`}
            >
              {uploading ? "⏳" : "📷"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <h3 style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
            {profile?.full_name || user.email?.split("@")[0] || "Usuário"}
          </h3>
          <p
            className="profile-email"
            style={{ wordBreak: "break-all", overflowWrap: "break-word" }}
          >
            {user.email}
          </p>
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
                <p style={{ wordBreak: "break-word" }}>
                  {profile?.full_name || "Não informado"}
                </p>
              </div>

              <div className="info-group">
                <label>E-mail</label>
                <p style={{ wordBreak: "break-all" }}>{user.email}</p>
              </div>

              <div className="info-group">
                <label>Telefone</label>
                <p>{profile?.phone || "Não informado"}</p>
              </div>

              <div className="info-group">
                <label>Endereço</label>
                {profile?.address?.street ? (
                  <p style={{ wordBreak: "break-word" }}>
                    {profile.address.street}
                    <br />
                    {profile.address.city} - {profile.address.state}
                    <br />
                    CEP: {profile.address.zip}
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
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Seu nome completo"
                  disabled={saving}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                  disabled={saving}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <label>Endereço - Rua</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  placeholder="Rua, número, complemento"
                  disabled={saving}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Cidade"
                    disabled={saving}
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="UF"
                    maxLength="2"
                    disabled={saving}
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="form-group">
                  <label>CEP</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) =>
                      setFormData({ ...formData, zip: e.target.value })
                    }
                    placeholder="00000-000"
                    disabled={saving}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar alterações"}
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
