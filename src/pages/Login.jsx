import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchParams] = useSearchParams();

  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const type = searchParams.get('type');
    
    if (errorParam === 'confirmation') {
      setError('Link de confirmação expirado ou inválido. Solicite um novo link de confirmação.');
    }
    
    if (user) {
      navigate('/dashboard');
    }
  }, [searchParams, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
        setSuccessMessage('Conta criada! Verifique seu email para confirmar o cadastro.');
        setIsLogin(true);
      }
    } catch (err) {
      const message = err.message || err.error_description || '';
      if (message.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada e confirme seu email.');
      } else if (message.includes('Invalid login')) {
        setError('Email ou senha incorretos');
      } else if (message.includes('User already registered')) {
        setError('Este email já está cadastrado');
      } else {
        setError(getErrorMessage(message));
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (message) => {
    if (message.includes('email-already-in-use')) return 'Este email já está em uso';
    if (message.includes('invalid-email')) return 'Email inválido';
    if (message.includes('weak-password')) return 'Senha muito fraca (mínimo 6 caracteres)';
    if (message.includes('user-not-found')) return 'Usuário não encontrado';
    if (message.includes('wrong-password')) return 'Senha incorreta';
    if (message.includes('Invalid login')) return 'Email ou senha incorretos';
    return 'Erro ao processar requisição';
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? 'Login' : 'Criar Conta'}</h1>
        
        {error && <div className="auth-error">{error}</div>}
        
        {successMessage && (
          <div className="auth-success">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>
        
        <p className="auth-switch">
          {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
            className="auth-link"
          >
            {isLogin ? 'Cadastre-se' : 'Entre'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
