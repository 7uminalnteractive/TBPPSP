# THE BEST PATCH PSP — Site

Site institucional/catálogo da THE BEST PATCH PSP, loja de patches de futebol para PSP.
Produtos e imagens agora vêm do Supabase (projeto TBP, tabela `public.products` e bucket `product-images`).

## Stack

Site estático (HTML + CSS + JS puro, sem build step). Não depende de Node/React —
funciona direto no navegador e é compatível com deploy no Vercel, GitHub Pages,
Netlify, etc.

- `index.html` — estrutura da página
- `styles.css` — todo o design system (cores, tipografia, layout, responsivo)
- `app.js` — catálogo dinâmico, filtro de categorias, menu mobile
- `assets/patches/*.svg` — patches placeholder (troque pelas artes reais)

## Rodando localmente

Não precisa instalar nada. Basta abrir `index.html` no navegador, ou rodar um
servidor local simples:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

## Deploy no Vercel

1. Suba esta pasta para um repositório no GitHub.
2. No [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. Em **Framework Preset**, escolha **Other** (site estático). Não é necessário
   comando de build nem output directory — o Vercel serve os arquivos direto.
4. Clique em **Deploy**.

## Próximos passos sugeridos

- **Trocar os patches placeholder**: os escudos em `assets/patches/` são gerados
  por SVG só para preencher o layout. Troque pelas artes reais dos seus patches
  (PNG/WEBP) e atualize os caminhos em `app.js` (array `PRODUCTS`).
- **Conectar ao Supabase**: para uma loja funcional (carrinho, pagamento, downloads
  protegidos, login de usuário), o próximo passo é integrar o Supabase para
  autenticação, banco de dados de produtos e Storage para os arquivos dos patches.
  Posso te ajudar a estruturar isso quando quiser evoluir para loja completa.
- **Domínio próprio**: depois do deploy, configure seu domínio (ex: gmpes.com.br)
  nas configurações do projeto no Vercel.

## Estrutura de cores

| Token       | Hex       | Uso                          |
|-------------|-----------|-------------------------------|
| `--black`   | `#0A0705` | Fundo base                   |
| `--surface` | `#1C120C` | Cards e superfícies           |
| `--ember`   | `#FF6B1A` | Cor primária (CTAs, destaque) |
| `--amber`   | `#FFB347` | Destaque secundário, hover    |
| `--text`    | `#EFE4D8` | Texto principal               |
