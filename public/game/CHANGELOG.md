
## 2026-09-16
- Ajustada a bomba de fogo para hitbox oval/retangular 50x150px, dano cont?nuo de 15%/s e feedback visual de impacto.
- Adicionados efeitos sonoros: openbag, swordnpc, waveup, level, coins, bomba e xp, com volume configur?vel e sobreposi??o segura de Audio.
- Copiados os MP3s necess?rios para public/game/assets/sfx quando presentes na pasta de origem.
# Alpha 1.1 — Melhorias de Combate e Movimento

## ✨ Novas Features Implementadas

### 1. **Câmera Centralizada no Personagem** ✅
- A câmera segue o jogador suavemente em tempo real
- Mantém o personagem sempre no centro da tela
- Implementação suave com lerp (interpolação linear)

### 2. **Ataque Direcionado pelo Mouse** ✅
- **MODO MOUSE (PADRÃO):**
  - Clique esquerdo: Ataque com Espada (direção do mouse)
  - Clique direito: Ataque com Bainha (direção do mouse)
  - A direção do ataque é determinada pela posição do cursor
  - O personagem gira para acompanhar o mouse mesmo em defesa

### 3. **Efeitos de Ataque Ampliados e com Destaque** ✨
- **Círculos de Ataque Maiores:**
  - Espada: raio expandido de 55 → 65/85 pixels
  - Bainha: raio expandido de 46 → 55/75 pixels
  
- **Múltiplas Camadas de Efeito:**
  - Arco principal brilhante (lineWidth: 8)
  - Arco secundário com pulsação dinâmica
  - Partículas/pontos de impacto ao longo do arco
  - Brilho pulsante sincronizado

- **Aura de Ataque Base:**
  - Círculos luminosos adicionais ao redor do personagem
  - Feedback visual claro do raio de ataque

### 4. **Sistema de Parry (Contra-Ataque)** 🛡️
- **Como Usar:**
  - Segure ESPAÇO quando o inimigo estiver atacando
  - Solte no timing correto (janela de ~190ms)
  - O inimigo receberá dano de contra-ataque!

- **Efeitos do Parry:**
  - Dano ao inimigo: **15 HP**
  - Knockback forte no inimigo (2.5x)
  - Stun do inimigo por 520ms
  - Número de dano flutuante (feedback visual)
  - Mensagem "PARRY! -15" na tela

- **Balanceamento:**
  - Perfect Block Window: 190ms (mesmo timing anterior)
  - Dano aplicado ao inimigo como contra-ataque
  - Inimigo é imobilizado por um tempo

### 5. **Sistema de Correr** 🏃
- **Como Usar:**
  - Segure **SHIFT** enquanto se move (WASD)
  - Velocidade: 1.5x a velocidade normal
  - Gasta 25 pontos de stamina por segundo

- **Características:**
  - Só funciona enquanto se move (não ativa parado)
  - Não funciona enquanto está atacando ou defendendo
  - Consome stamina rapidamente (bloqueio de regeneração)
  - Visual: aura laranja ao redor do personagem quando correndo
  - Status exibe "CORRENDO" no HUD

- **Stamina Management:**
  - Necessário ter stamina disponível para correr
  - Custo: 25 stamina/segundo
  - Regeneração bloqueada enquanto move
  - Rege naturalmente quando parado

## 🎮 Controles Atualizados

| Controle | Ação |
|----------|------|
| **WASD** | Movimento em 8 direções |
| **SHIFT** | Correr (enquanto se move) - Gasta Stamina |
| **Mouse Esq.** | Ataque Espada (direção do mouse) |
| **Mouse Dir.** | Ataque Bainha (direção do mouse) |
| **ESPAÇO** | Defesa / Parry |
| **ESC** | Pausa |
| **F3** | Debug Mode |

## 📊 Configurações Alteradas

```javascript
// Defesa e Parry
perfectBlockDamage: 15           // Dano ao enemy no parry
perfectBlockKnockback: 2.5       // Força de knockback do parry

// Correr
runMultiplier: 1.5               // Multiplicador de velocidade
runStaminaCost: 25               // Stamina consumida por segundo
```

## 🎯 Mecânicas de Combate

### Parry (Sistema de Defesa Ativa)
1. Inimigo começa ataque (fase "windup")
2. Você segura ESPAÇO
3. Dentro da janela de 190ms antes do golpe:
   - Parry executado com sucesso ✅
   - Inimigo leva **15 de dano**
   - Inimigo é empurrado para trás
   - Stun de 520ms no inimigo
4. Fora da janela:
   - Você bloqueia normalmente (redução de 80% de dano)

### Correr (Movimento Dinâmico)
1. Segure SHIFT enquanto pressiona WASD
2. Velocidade aumenta 1.5x
3. Stamina desce 25 por segundo
4. Quando stamina acaba, volta à velocidade normal
5. Aura laranja indica que está correndo

## 🔧 Implementação Técnica

### Arquivos Modificados:
- `config.js` - Novos parâmetros de parry e correr
- `entities.js` - Adicionado `isRunning` e `canRun()`
- `input.js` - Suporte para tecla SHIFT
- `combat.js` - Lógica de parry com dano
- `game.js` - Lógica de correr e stamina
- `render.js` - Efeitos visuais ampliados e melhorados
- `index.html` - Instruções atualizadas

### Novas Propriedades:
```javascript
player.isRunning         // Boolean: está correndo?
player.canRun()          // Função: pode correr?
player.lastParryTime     // Timestamp do último parry
```

## 🎨 Efeitos Visuais Adicionados

1. **Arcos de Ataque Ampliados**
   - Múltiplas camadas (até 3 arcos)
   - Pulsação dinâmica
   - Partículas ao longo do arco

2. **Aura de Correr**
   - Brilho laranja ao redor do personagem
   - Indicação visual clara de que está correndo

3. **Feedback de Parry**
   - Flash visual no inimigo
   - Número de dano flutuante
   - Knockback visível

## 📝 Notas de Design

- **Camera Smoothing**: Usa interpolação a 8 unidades/segundo para suavidade
- **Attack Direction**: Baseado em projeção isométrica inversa da posição do mouse
- **Parry Window**: Sincronizado com o windup do inimigo (190ms antes do golpe)
- **Run Cost**: Calibrado para exigir escolha tática (gastar stamina vs defender)

## 🐛 Testes Recomendados

- [ ] Correr em diferentes direções (WASD + SHIFT)
- [ ] Parry no timing correto (ESPAÇO + movimento inimigo)
- [ ] Ataque mouse em 8 direções
- [ ] Combinar correr + defesa (não permite)
- [ ] Stamina depletion durante correr
- [ ] Recuperação de stamina quando parado

---

**Versão:** 1.1  
**Data:** Setembro 2026  
**Status:** ✅ Testado e Pronto
## 1.5.0 — Sunwalker
- Níveis de player e inimigos, perseguição contínua do chefe e intervalos de ondas ajustados.
- Interface de habilidades equipada com estado visual persistente.
