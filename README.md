# Site Niky Lima Tattoo (Node.js)

Site estático servido por um servidor Node.js sem dependências (só módulos nativos).
Não precisa rodar `npm install`.

## Estrutura

```
server.js        servidor (porta vem de process.env.PORT, padrão 3000)
package.json     script "start": "node server.js"
public/
  index.html     página única (CSS e SEO dentro do arquivo)
  assets/site.js animações de rolagem, geometria de fundo e vídeos
  img/           logo, favicon, ícones e imagem de compartilhamento
  media/         fotos (.webp) e vídeos (.mp4)
  robots.txt, sitemap.xml, 404.html
```

## Publicar na Hostinger (plano com Node.js)

1. No hPanel, abra **Sites > Adicionar site** (ou **Gerenciar** no domínio) e escolha **Aplicativo Web Node.js**.
2. Envie o arquivo `.zip` deste projeto (ou conecte um repositório do GitHub).
3. Configure:
   - **Versão do Node.js:** 18 ou superior (20 ou 22 recomendado)
   - **Arquivo de entrada:** `server.js`
   - **Comando de inicialização:** `npm start`
4. Clique em **Implantar** e depois abra o domínio nikylimatattoo.com.
5. Ative o **SSL gratuito** do domínio no hPanel (o site usa https nos links de SEO).

Variável opcional: `CANONICAL_HOST=nikylimatattoo.com` redireciona `www.nikylimatattoo.com` para o domínio sem www.

## Plano sem Node.js (hospedagem compartilhada)

Como o site é estático, basta enviar **o conteúdo da pasta `public/`** para a pasta `public_html` pelo Gerenciador de Arquivos. O `index.html` fica na raiz de `public_html`.

## Publicar no GitHub Pages

O workflow `.github/workflows/deploy.yml` publica o conteÃºdo de `public/` na branch `main` apÃ³s cada push. TambÃ©m pode ser iniciado manualmente pela aba **Actions**. Configure **Settings > Pages > Build and deployment > Source** como **GitHub Actions**.

O endereÃ§o do site de projeto Ã© `https://michellbraga.github.io/site_nikyLima/`. Para usar `nikylimatattoo.com`, configure o domÃ­nio personalizado em **Settings > Pages > Custom domain** e aplique os registros DNS indicados pelo GitHub. O workflow nÃ£o altera DNS, e os metadados SEO continuam apontando para o domÃ­nio oficial.

## Testar no computador

```
npm start
```
Abra http://localhost:3000

## Depois de publicar

- Cadastre `https://nikylimatattoo.com/sitemap.xml` no Google Search Console.
- Mantenha o perfil da empresa no Google (Google Meu Negócio) com o mesmo endereço do site: Av. Pedro Teixeira, 351 - Dom Pedro, Manaus - AM, 69040-550.
- Para trocar fotos, substitua os arquivos em `public/media/` mantendo o mesmo nome.
