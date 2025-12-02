
# 📋 Configuração de Deploy em Homolog

## Como realizar o deploy manual para EC2


1. Certifique-se de ter acesso SSH ao servidor EC2 (IP/DNS, usuário e chave PEM).

2. Faça o build do projeto localmente:

   ```bash
   pnpm build
   ```

3. Transfira os arquivos de build para o servidor EC2 usando `scp` ou similar:

   ```bash
   scp -i caminho/para/chave.pem -r dist/ usuario@host:/caminho/da/aplicacao
   ```

4. Acesse o servidor via SSH:

   ```bash
   ssh -i caminho/para/chave.pem usuario@host
   ```

5. No servidor, reinicie o serviço da aplicação (exemplo com PM2 ou Docker, conforme sua stack).

## Troubleshooting

- Verifique se a chave SSH está válida e não expirou
- Usuário SSH tem permissão para acessar o diretório de destino
- Nginx (ou outro proxy) está instalado e rodando
- Porta 22 (SSH) está aberta no security group do EC2

## Referências

- [AWS EC2 Key Pairs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
