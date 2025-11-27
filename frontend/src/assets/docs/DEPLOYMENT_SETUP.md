# 📋 Configuração de Secrets para Deploy em Homolog

## 🔧 Secrets Necessários no GitHub

Para que o deploy para EC2 funcione, você precisa configurar os seguintes secrets no repositório:

### 1. **EC2_HML_HOST** 🌐
- **O quê**: IP ou DNS do servidor EC2 de homolog
- **Exemplo**: `ec2-52-123-456-789.us-east-1.compute.amazonaws.com` ou `192.168.1.100`
- **Como adicionar**: 
  - Acesse: https://github.com/godoyrw/gig_frontend/settings/secrets/actions
  - Clique em "New repository secret"
  - Nome: `EC2_HML_HOST`
  - Valor: Seu IP/DNS do EC2

### 2. **EC2_HML_USER** 👤
- **O quê**: Usuário SSH para acessar o EC2
- **Exemplo**: `ubuntu` ou `ec2-user`
- **Como adicionar**: 
  - Acesse: https://github.com/godoyrw/gig_frontend/settings/secrets/actions
  - Nome: `EC2_HML_USER`
  - Valor: Seu usuário SSH

### 3. **EC2_HML_SSH_KEY** 🔑
- **O quê**: Conteúdo da chave SSH privada (PEM format)
- **Como obter**:
  - Você deve ter um arquivo `.pem` da sua instância EC2
  - Abra o arquivo em um editor de texto
  - Copie TODO o conteúdo (incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`)
- **Como adicionar**: 
  - Acesse: https://github.com/godoyrw/gig_frontend/settings/secrets/actions
  - Nome: `EC2_HML_SSH_KEY`
  - Valor: Cole todo o conteúdo da chave PEM

### 4. **EC2_HML_APP_PATH** 📁
- **O quê**: Caminho no servidor EC2 onde a aplicação está instalada
- **Exemplo**: `/var/www/gig` ou `/home/ubuntu/apps/gig`
- **Como adicionar**: 
  - Acesse: https://github.com/godoyrw/gig_frontend/settings/secrets/actions
  - Nome: `EC2_HML_APP_PATH`
  - Valor: Caminho da aplicação no EC2

## ✅ Verificação

Após adicionar os secrets, você pode verificar se estão corretos testando:

```bash
# Localmente, teste a conexão SSH
ssh -i caminho/para/chave.pem seu_usuario@seu_host "echo 'SSH funcionando!'"
```

Se receber "SSH funcionando!" é sinal de que os credentials estão corretos.

## 🚀 Deploy

Após configurar todos os secrets, o próximo push para a branch `homolog` disparará o deploy automaticamente.

## 🔍 Troubleshooting

Se o deploy ainda falhar, verifique:
1. ✓ Chave SSH está válida e não expirou
2. ✓ Usuário SSH tem permissão para acessar o diretório `EC2_HML_APP_PATH`
3. ✓ Nginx está instalado e rodando no EC2
4. ✓ Porta 22 (SSH) está aberta no security group do EC2
5. ✓ IP da máquina GitHub Actions está liberado (se houver firewall)

## 📝 Referências

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS EC2 Key Pairs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
