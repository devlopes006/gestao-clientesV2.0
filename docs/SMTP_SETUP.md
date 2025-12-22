# SMTP (e-mail) para notificações de tarefas

Adicione as seguintes variáveis ao seu .env.local:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-ou-app-password
SMTP_FROM="Nome do Remetente <seu-email@gmail.com>"

- Para Gmail, crie uma senha de app em https://myaccount.google.com/apppasswords
- Para outros provedores, ajuste SMTP_HOST, PORT, SECURE, USER, PASS conforme necessário.
- O campo FROM pode ser personalizado, mas deve ser um e-mail autorizado pelo provedor.

Se SMTP estiver configurado, notificações de tarefa serão enviadas mesmo sem Resend.
