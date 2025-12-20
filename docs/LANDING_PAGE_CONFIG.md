# Configuração da Landing Page para Captura de Leads

## ⚙️ Configuração Necessária

A Landing Page precisa enviar um POST para o endpoint `/api/leads` do sistema de gestão.

### 1. URL do Endpoint

**Desenvolvimento (local):**

```
http://localhost:3000/api/leads
```

**Produção:**

```
https://mygest.netlify.app/api/leads
```

### 2. Estrutura do Payload

O formulário deve enviar um JSON com os seguintes campos:

```json
{
  "name": "Nome Completo", // OBRIGATÓRIO
  "email": "email@example.com", // OBRIGATÓRIO
  "phone": "11999999999", // OBRIGATÓRIO (só números)
  "plan": "Premium", // OPCIONAL
  "bestTime": "Manhã", // OPCIONAL
  "utmSource": "google", // OPCIONAL
  "utmMedium": "cpc", // OPCIONAL
  "utmCampaign": "campanha", // OPCIONAL
  "origin": "landing-page", // OPCIONAL
  "timestamp": "2025-12-20T19:49:10.809Z" // OPCIONAL
}
```

### 3. Headers Necessários

```javascript
headers: {
  'Content-Type': 'application/json'
}
```

### 4. Código de Exemplo (JavaScript)

```javascript
async function enviarLead(dados) {
  try {
    const response = await fetch('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: dados.nome,
        email: dados.email,
        phone: dados.telefone.replace(/\D/g, ''), // Remove formatação
        plan: dados.plano || null,
        bestTime: dados.melhorHorario || null,
        origin: 'landing-page',
      }),
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar lead')
    }

    const result = await response.json()
    console.log('Lead enviado:', result)

    // Mostrar mensagem de sucesso
    alert('✅ Cadastro realizado com sucesso!')

    return result
  } catch (error) {
    console.error('Erro:', error)
    alert('❌ Erro ao enviar cadastro. Tente novamente.')
  }
}
```

### 5. Exemplo com Formulário HTML

```html
<form id="leadForm" onsubmit="handleSubmit(event)">
  <input type="text" name="nome" required placeholder="Nome completo" />
  <input type="email" name="email" required placeholder="E-mail" />
  <input
    type="tel"
    name="telefone"
    required
    placeholder="WhatsApp (11) 99999-9999"
  />

  <select name="plano">
    <option value="">Selecione um plano</option>
    <option value="Básico">Básico</option>
    <option value="Premium">Premium</option>
    <option value="Empresarial">Empresarial</option>
  </select>

  <select name="melhorHorario">
    <option value="">Melhor horário</option>
    <option value="Manhã">Manhã (9h-12h)</option>
    <option value="Tarde">Tarde (13h-18h)</option>
    <option value="Noite">Noite (18h-21h)</option>
  </select>

  <button type="submit">Quero participar!</button>
</form>

<script>
  async function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.target)
    const dados = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      telefone: formData.get('telefone'),
      plano: formData.get('plano'),
      melhorHorario: formData.get('melhorHorario'),
    }

    await enviarLead(dados)
  }

  async function enviarLead(dados) {
    try {
      const response = await fetch('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: dados.nome,
          email: dados.email,
          phone: dados.telefone.replace(/\D/g, ''),
          plan: dados.plano || null,
          bestTime: dados.melhorHorario || null,
          origin: 'landing-page',
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar')
      }

      const result = await response.json()
      console.log('✅ Lead enviado:', result)

      // Mostrar mensagem de sucesso
      alert(
        '✅ Cadastro realizado com sucesso! Nossa equipe entrará em contato em breve.'
      )

      // Limpar formulário
      event.target.reset()

      return result
    } catch (error) {
      console.error('❌ Erro:', error)
      alert('❌ Erro ao enviar cadastro. Tente novamente.')
      throw error
    }
  }
</script>
```

## 🔧 Debugging

### Como testar se está funcionando:

1. **Abra o DevTools (F12)** na Landing Page
2. **Vá na aba Network**
3. **Preencha o formulário e envie**
4. **Procure a requisição POST para `/api/leads`**
5. **Verifique:**
   - Status Code: deve ser **200**
   - Response: deve ter `{"success":true,"clientId":"...","action":"created"}`

### Se aparecer erro 401 ou redirect para /login:

Isso significa que o middleware está bloqueando. Verifique se a URL está correta e se não tem `/` extra no final.

### Se aparecer erro de CORS:

O backend já está configurado para aceitar requisições externas. Se aparecer erro de CORS, verifique se está usando HTTPS ou HTTP corretamente.

### Se o telefone não normalizar:

Use este código para limpar o telefone:

```javascript
const phoneClean = phone.replace(/\D/g, '') // Remove tudo que não é número
```

## 📝 Variáveis de Ambiente na Landing Page

Se sua LP usa `.env`:

```env
# Desenvolvimento
NEXT_PUBLIC_API_URL=http://localhost:3000

# Produção
NEXT_PUBLIC_API_URL=https://mygest.netlify.app
```

E no código:

```javascript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const endpoint = `${apiUrl}/api/leads`
```

## ✅ Checklist de Configuração

- [ ] URL do endpoint está correta (http://localhost:3000/api/leads)
- [ ] Headers incluem 'Content-Type': 'application/json'
- [ ] Campos obrigatórios: name, email, phone
- [ ] Telefone é enviado sem formatação (só números)
- [ ] DevTools Network mostra status 200
- [ ] Response tem success: true
- [ ] Lead aparece em http://localhost:3000/leads

## 🚀 Produção

Quando subir para produção, troque a URL para:

```
https://mygest.netlify.app/api/leads
```

E configure CORS se necessário (já está permitido no backend).
