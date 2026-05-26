// =============================================================
// ARQUIVO: admin.js
// FUNÇÃO: Toda a lógica do painel administrativo.
//
// COMO USAR ESTE ARQUIVO:
// - Quer mexer nos SERVIÇOS? Procure: [BLOCO SERVIÇOS].
// - Quer mexer na AGENDA? Procure: [BLOCO AGENDA].
// - Quer mexer nos PRODUTOS? Procure: [BLOCO PRODUTOS].
// - Quer mexer nos USUÁRIOS/EQUIPE? Procure: [BLOCO USUÁRIOS].
// - Quer mexer nos HORÁRIOS/BLOQUEIOS? Procure: [BLOCO BLOQUEIOS].
// - Quer mexer no DASHBOARD? Procure: [BLOCO DASHBOARD].
//
// IMPORTANTE:
// - NÃO alterei nenhuma função, chamada, chave API ou regra.
// - Só adicionei comentários para facilitar manutenção no VS Code.
// - O HTML chama várias funções via onclick="...". Por isso, no final
//   do arquivo elas são expostas em `window.nomeDaFuncao`.
// =============================================================

import { sb } from './supabase.js';

// Cliente Supabase importado do arquivo supabase.js.
// Sempre que aparecer `sb.from('nome_da_tabela')`, o código está lendo/escrevendo no banco.

// Lista de serviços carregada do Supabase.
// Usada no cadastro de serviços e também na agenda para calcular duração/preço.
let services = [];

  
// Mapa que liga cada seção do HTML a uma permissão do usuário.
// Exemplo: seção `sec-servicos` exige permissão `servicos`.
const SECTION_PERMISSION = {
  'sec-agenda': 'agenda',
  'sec-produtos': 'produtos',
  'sec-servicos': 'servicos',
  'sec-usuarios': 'usuarios',
  'sec-horarios': 'horarios',
  'sec-dash': 'dashboard'
};


// =======================
// [BLOCO SERVIÇOS]
// SERVIÇOS – PAINEL ADMIN
// Onde mexer para alterar cadastro/listagem de serviços.
// =======================

// -------------------------------------------------------------
// FUNÇÃO: renderServices()
// O QUE FAZ:
// - Busca todos os serviços na tabela `services` do Supabase.
// - Guarda o resultado na variável global `services`.
// - Monta os cards dentro da div `#services-list` no HTML.
//
// ONDE MEXER:
// - Para mudar o visual dos cards de serviço, mexa no template HTML
//   dentro do `services.map(...)`.
// - Para mudar a ordem, mexa no `.order('id', { ascending: true })`.
// -------------------------------------------------------------


 async function renderServices() {
  const list = document.getElementById('services-list');

  const { data, error } = await sb
    .from('services')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  services = data || [];

  list.innerHTML = services.map(s => `
    <div class="card">
      <h4>${s.name}</h4>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// FUNÇÃO: openServiceModal()
// O QUE FAZ:
// - Abre o modal para criar um NOVO serviço.
// - Limpa os campos do formulário.
// - Esconde o botão de excluir, porque ainda não existe serviço salvo.
//
// ONDE MEXER:
// - Para mudar valores padrão do novo serviço, altere os campos aqui.
// -------------------------------------------------------------

 

function openServiceModal() {
  document.getElementById('service-id').value = '';
  document.getElementById('service-name').value = '';
  document.getElementById('service-price').value = '';
  document.getElementById('service-duration').value = '';
  document.getElementById('service-active').checked = true;

  document.getElementById('service-no-price').checked = false;
  document.getElementById('service-price').disabled = false;

  document.getElementById('service-modal-title').innerText = 'Novo Serviço';
  document.getElementById('btn-del-service').style.display = 'none';

  openModal('modal-service');
}

// -------------------------------------------------------------
// FUNÇÃO: editService(id)
// O QUE FAZ:
// - Recebe o ID do serviço clicado.
// - Procura esse serviço na lista `services`.
// - Preenche o modal com os dados para edição.
// - Mostra o botão de excluir.
//
// ONDE MEXER:
// - Para adicionar novos campos no serviço, preencha eles aqui também.
// -------------------------------------------------------------


function editService(id) {
  const s = services.find(x => x.id === id);

  document.getElementById('service-id').value = s.id;
  document.getElementById('service-name').value = s.name;
  document.getElementById('service-price').value = s.price ?? '';
  document.getElementById('service-duration').value = s.duration ?? '';
  document.getElementById('service-active').checked = s.active;
  document.getElementById('service-modal-title').innerText = 'Editar Serviço';

  document.getElementById('btn-del-service').style.display = 'flex';

  openModal('modal-service');

const noPrice = s.price === null;

document.getElementById('service-no-price').checked = noPrice;
document.getElementById('service-price').disabled = noPrice;

}

// -------------------------------------------------------------
// FUNÇÃO: saveService()
// O QUE FAZ:
// - Lê os campos do modal de serviço.
// - Se tiver ID, atualiza o serviço existente no Supabase.
// - Se não tiver ID, cria um novo serviço no Supabase.
// - Fecha o modal e recarrega a lista.
//
// ONDE MEXER:
// - Para validar campos obrigatórios, mexa neste ponto.
// - Para adicionar coluna nova na tabela `services`, inclua no objeto `data`.
// -------------------------------------------------------------




async function saveService() {
  const id = document.getElementById('service-id').value;

  const data = {
    name: document.getElementById('service-name').value.trim(),
    price: document.getElementById('service-price').value || null,
    duration: document.getElementById('service-duration').value || null,
    active: document.getElementById('service-active').checked
  };

  if (!data.name) return alert('Informe o nome');

  if (id) {
    await sb.from('services').update(data).eq('id', id);
  } else {
    await sb.from('services').insert([data]);
  }

  closeModal('modal-service');
  renderServices();
}

// -------------------------------------------------------------
// FUNÇÃO: deleteService()
// O QUE FAZ:
// - Exclui do Supabase o serviço aberto no modal.
// - Pede confirmação antes de apagar.
// - Fecha o modal e recarrega a lista.
// -------------------------------------------------------------

async function deleteService() {
  const id = document.getElementById('service-id').value;

  if (!confirm('Excluir?')) return;

  await sb.from('services').delete().eq('id', id);

  closeModal('modal-service');
  renderServices();
}



 // =======================
  // [BLOCO USUÁRIOS / LOGIN / ESTADO GERAL]
// USUÁRIOS / BARBEIROS
  // =======================

  

    let currentUser = null;


      
        let appointments = [];
        let products = []; // ✅ ESSENCIAL (faltando aqui)
        let blocks = JSON.parse(localStorage.getItem('gp_blocks')) || [];
        let selectedDate = new Date().toISOString().split('T')[0];
        let fluxChart = null;

        
window.onload = () => {
  const saved = localStorage.getItem('gp_logged_user');

  if (saved) {
    currentUser = JSON.parse(saved);

    // MOSTRA O SISTEMA
    document.querySelector('.main-content').style.display = 'block';

    // ESCONDE LOGIN
    document.getElementById('login-screen').style.display = 'none';

    initApp();
  } else {
    // MOSTRA LOGIN
    document.getElementById('login-screen').style.display = 'flex';

    // ESCONDE O SISTEMA
    document.querySelector('.main-content').style.display = 'none';
  }
};

// -------------------------------------------------------------
// FUNÇÃO: doLogin()
// O QUE FAZ:
// - Lê usuário e senha da tela de login.
// - Busca os usuários na tabela `users`.
// - Confere login/senha.
// - Salva o usuário logado no localStorage e inicia o app.
// -------------------------------------------------------------


        
    async function doLogin() {
  const login = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;

  // Se deixou usuário ou senha vazio
  if (!login || !pass) {
    showLoginMsg('Preencha todos os campos');
    return;
  }

  try {
    const { data: users, error } = await sb.from('users').select('*');

    // Se deu erro no Supabase/conexão
    if (error) {
      console.error(error);
      showLoginMsg('Erro de conexão. Tente novamente');
      return;
    }

    const found = (users || []).find(u => {
  const userLogin = (u.login || '').toLowerCase();
  const userEmail = (u.email || '').toLowerCase();
  const typedLogin = login.toLowerCase();

  return (userLogin === typedLogin || userEmail === typedLogin) && u.password === pass;
});

    // Se usuário ou senha estiver errado
    if (!found) {
      showLoginMsg('Usuário ou senha incorretos');
      return;
    }

    // Login OK
    currentUser = found;
    localStorage.setItem('gp_logged_user', JSON.stringify(found));

    // Esconde tela de login
    document.getElementById('login-screen').style.display = 'none';

    // Mostra painel
    document.querySelector('.main-content').style.display = 'block';

    initApp();

  } catch (err) {
    console.error(err);
    showLoginMsg('Erro de conexão. Tente novamente');
  }
}

// FUNÇÃO: doLogout()
// Sai do painel removendo o usuário salvo e recarregando a página.
       

function doLogout() {
  localStorage.removeItem('gp_logged_user');

  // MOSTRA LOGIN
  document.getElementById('login-screen').style.display = 'flex';

  // ESCONDE SISTEMA
  document.querySelector('.main-content').style.display = 'none';
}

// -------------------------------------------------------------
// FUNÇÃO: initApp()
// O QUE FAZ:
// - Inicia o painel depois do login.
// - Define data inicial, aplica permissões e carrega todas as áreas.
// - Liga eventos de barbeiro/data para recalcular horários disponíveis.
// -------------------------------------------------------------



        
        function initApp() {
        // ✅ Data inicial
        document.getElementById('display-date').innerText = formatDate(selectedDate);
        document.getElementById('app-date').value = selectedDate;

        // ✅ Permissões
        applyMenuPermissions();


        // ✅ Elementos (com proteção)
        const barberSelect = document.getElementById('app-barber');
        const dateInput = document.getElementById('app-date');

        if (barberSelect) {
            barberSelect.onchange = loadAvailableTimes;
        }

        if (dateInput) {
            dateInput.onchange = loadAvailableTimes;
        }

        // ✅ Render geral
        loadAppointments();

        
        
        if (!window.appInterval) {
            window.appInterval = setInterval(loadAppointments, 5000);
        }



        renderProducts();
        renderServices();
        renderUsers();
        renderBlocks();
        checkNotifications();

        }

// FUNÇÃO: renderAll()
// Recarrega várias partes da tela. Útil depois de salvar/excluir algo local.

        function renderAll() {
            renderAgenda();
            renderProducts();
            renderServices();
            renderUsers();
            renderBlocks();
            checkNotifications();
        }

// FUNÇÃO: save()
// Salva dados locais no localStorage. Hoje produtos e bloqueios usam localStorage.


        function save() {
            localStorage.setItem('gp_apps', JSON.stringify(appointments));
            localStorage.setItem('gp_prods', JSON.stringify(products));
            localStorage.setItem('gp_blocks', JSON.stringify(blocks));
        }

// FUNÇÃO: toggleSidebar()
// Abre/fecha o menu lateral no mobile/desktop.

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('sidebar-overlay').classList.toggle('active');
        }

// -------------------------------------------------------------
// FUNÇÃO: navigate(id, el)
// O QUE FAZ:
// - Troca a seção visível do painel.
// - Verifica permissão antes de entrar na seção.
// - Atualiza o título no topo.
// - Se entrar no dashboard, renderiza o gráfico.
// -------------------------------------------------------------

       
        function navigate(id, el) {
        const requiredPerm = SECTION_PERMISSION[id];

        if (requiredPerm && !currentUser.permissions.includes(requiredPerm)) {
            alert('Você não tem permissão para acessar esta área.');
            return;
        }

        document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');

        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        if (el) el.classList.add('active');

        document.getElementById('view-title').innerText =
            el ? el.innerText : id.replace('sec-', '').toUpperCase();

        if (id === 'sec-dash') renderDashboard();
        toggleSidebar();
        }

// FUNÇÃO: applyMenuPermissions()
// Esconde itens do menu conforme as permissões do usuário logado.


        
        function applyMenuPermissions() {
        document.querySelectorAll('.sidebar .menu-item').forEach(item => {
            const onclick = item.getAttribute('onclick');
            if (!onclick) return;

            const match = onclick.match(/navigate\('(.*?)'/);
            if (!match) return;

            const section = match[1];
            const requiredPerm = SECTION_PERMISSION[section];
            if (!requiredPerm) return;

            if (!currentUser.permissions.includes(requiredPerm)) {
            item.style.display = 'none';
            }
        });
        }

// FUNÇÃO: toggleNotifDropdown()
// Abre/fecha o dropdown de notificações de estoque.


        function toggleNotifDropdown() {
            document.getElementById('notif-dropdown').classList.toggle('active');
        }

// FUNÇÃO: editUser(userId)
// Busca um usuário no Supabase e abre o modal de edição preenchido.

        async function editUser(userId) {
  const { data: users } = await sb.from('users').select('*');

  const user = users.find(u => u.id === userId);
  if (!user) return;

document.getElementById('edit-user-id').value = user.id;
document.getElementById('edit-user-name').value = user.name;
document.getElementById('edit-user-login').value = user.login;
document.getElementById('edit-user-email').value = user.email || '';
document.getElementById('edit-user-phone').value = user.phone || '';
document.getElementById('edit-user-whatsapp').value = user.whatsapp || '';
document.getElementById('edit-user-role').value = user.role;
document.getElementById('edit-user-active').checked = user.active;document.getElementById('edit-user-active').checked = user.active;

  const permBox = document.getElementById('edit-user-permissions');

  const allPerms = [
    { id: 'agenda', label: 'Agenda' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'produtos', label: 'Produtos' },
    { id: 'usuarios', label: 'Usuários' },
    { id: 'horarios', label: 'Horários' },
    { id: 'dashboard', label: 'Dashboard' }
  ];

  permBox.innerHTML = allPerms.map(p => `
    <span class="tag ${user.permissions.includes(p.id) ? 'selected' : ''}"
      data-perm="${p.id}"
      onclick="this.classList.toggle('selected')">
      ${p.label}
    </span>
  `).join('');

  openModal('modal-edit-user');
}

// FUNÇÃO: saveUserEdit()
// Salva alterações de nome, perfil, permissões e status ativo do usuário.

       async function saveUserEdit() {
  const id = Number(document.getElementById('edit-user-id').value);

  const permissions = Array.from(
    document.querySelectorAll('#edit-user-permissions .tag.selected')
  ).map(t => t.dataset.perm);

  const { error } = await sb
    .from('users')
.update({
  name: document.getElementById('edit-user-name').value,
  email: document.getElementById('edit-user-email').value.trim(),
  phone: document.getElementById('edit-user-phone').value.trim(),
  whatsapp: document.getElementById('edit-user-whatsapp').value.trim(),
  role: document.getElementById('edit-user-role').value,
  permissions,
  active: document.getElementById('edit-user-active').checked
})
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('Erro ao salvar usuário');
    return;
  }

  closeModal('modal-edit-user');
  renderUsers();
}

// FUNÇÃO: deleteUser()
// Exclui o usuário selecionado no Supabase.

       async function deleteUser() {
  const id = Number(document.getElementById('edit-user-id').value);

  if (!confirm('Excluir usuário?')) return;

  await sb.from('users').delete().eq('id', id);

  closeModal('modal-edit-user');
  renderUsers();
}


        // [BLOCO AGENDA]
// AGENDA

// FUNÇÃO: renderAgenda()
// Monta a lista de agendamentos da data selecionada e calcula o total estimado.
       async function renderAgenda() {
  const list = document.getElementById('agenda-list');

  const { data: users } = await sb.from('users').select('*');

  let filtered = appointments.filter(a => a.date === selectedDate);

  if (currentUser.role !== 'admin') {
    filtered = filtered.filter(a => String(a.barberId) === String(currentUser.id));
  }

  list.innerHTML = filtered.length
    ? ''
    : '<div style="text-align:center; padding:40px; color:var(--text-gray);">Sem cortes marcados.</div>';

  let total = 0;

  filtered.sort((a,b) => a.time.localeCompare(b.time)).forEach(a => {

    const barber = users.find(u => String(u.id) === String(a.barberId));
    const barberName = barber ? barber.name : 'Não definido';

    if (a.status !== 'cancelled') total += a.price;

    const item = document.createElement('div');
    item.className = `agenda-item ${a.status}`;

    item.innerHTML = `
      <div style="flex:1">
        <div class="item-time">${a.time}</div>
        <h4 style="font-size:16px;">${a.name}</h4>

        <p style="font-size:12px; color:var(--text-gray)">
          ${currentUser.role === 'admin' ? `💈 ${barberName}<br>` : ''}
          ${a.services.join(', ')} • R$ ${a.price}
        </p>

        <div class="item-actions">
          ${a.status === 'open' ? `<button onclick="confirmApp(${a.id})">✔</button>` : ''}
          <button onclick="completeApp(${a.id})">✅</button>
          <button onclick="cancelApp(${a.id})">❌</button>
        </div>
      </div>
    `;

    list.appendChild(item);
  });

  document.getElementById('display-total').innerText = `R$ ${total}`;
}

// FUNÇÃO: confirmApp(id)
// Marca um agendamento como confirmado.

       async function confirmApp(id) {
            await sb
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', id);

            loadAppointments();
        }

// FUNÇÃO: completeApp(id)
// Marca um agendamento como concluído.
        
        async function completeApp(id) {
            await sb
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', id);

            loadAppointments();
        }

// FUNÇÃO: cancelApp(id)
// Marca um agendamento como cancelado.

        async function cancelApp(id) {
            if (!confirm('Cancelar?')) return;

            await sb
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

            loadAppointments();
        }

// FUNÇÃO: saveAppointment()
// Cria um novo agendamento usando barbeiro, data, horário e serviços selecionados.

        async function saveAppointment() {
    const barberId = Number(document.getElementById('app-barber').value);
    const name = document.getElementById('app-name').value;
    const tel  = document.getElementById('app-tel').value;
    const date = document.getElementById('app-date').value;
    const time = document.getElementById('app-time').value;

    const tags = document.querySelectorAll('.tag.selected');

    if (!name || !time || tags.length === 0) {
        return alert('Preencha tudo!');
    }

    let selectedServices = [];
    let price = 0;
    let totalDuration = 0;

    tags.forEach(t => {
        selectedServices.push(t.dataset.name);
        price += parseInt(t.dataset.price);

        const service = services.find(s => s.name === t.dataset.name);
        if (service && service.duration) {
            totalDuration += service.duration;
        }
    });

    const { error } = await sb.from('appointments').insert([{
        name,
        tel,
        date,
        time,
        services: selectedServices,
        price,
        status: 'open',
        barberId: String(barberId),
        duration: totalDuration
    }]);

    if (error) {
        console.error(error);
        alert('Erro ao salvar!');
        return;
    }

    closeModal('modal-agenda');
    loadAppointments();
}


       // [BLOCO PRODUTOS]
// PRODUTOS


// ========================
// LOAD PRODUCTS (SUPABASE)
// ========================
// Carrega produtos do BD

let products = [];

async function loadProducts() {
  const { data, error } = await sb
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar produtos:', error);
    return;
  }

  // 🔥 ajustar nomes para compatibilidade
  products = (data || []).map(p => ({
    ...p,
    priceOld: p.price_old,
    isPromo: p.is_promo
  }));

  
  renderProducts();

}


// FUNÇÃO: renderProducts()

// Renderiza os produtos carregados do Supabase

function renderProducts() {
  const list = document.getElementById('product-list');
  if (!list) return;

  if (!products.length) {
    list.innerHTML = `
      <p style="text-align:center;">
        Nenhum produto cadastrado
      </p>
    `;
    return;
  }

  list.innerHTML = products.map(p => `
    <div class="product-card">

      ${p.isPromo ? '<div class="promo-tag">Promoção</div>' : ''}

      <div class="product-image-container">
        ${
          p.img 
          ? `<img src="${p.img}" />` 
          : `<div class="no-image">📦</div>`
        }
      </div>

      <div class="product-info">
        <span class="product-name">${p.name}</span>

        <p class="product-desc">
          ${p.desc || 'Sem descrição'}
        </p>

        <div class="product-pricing">
          <span class="price-current">
            R$ ${(+p.price || 0).toFixed(2)}
          </span>

          ${p.priceOld > 0 
            ? `<span class="price-old">
                R$ ${(+p.priceOld).toFixed(2)}
              </span>`
            : ''
          }
        </div>

        <div class="stock-info">
          <span>Estoque</span>
          <span class="stock-status ${(+p.stock || 0) < 5 ? 'stock-low' : 'stock-ok'}">
            ${p.stock} unid.
          </span>
        </div>
        
        ${(+p.stock || 0) <= 0 
          ? `<span style="color:red;font-size:12px;">Esgotado</span>`
          : ''
        }


        <button class="btn-primary"
          onclick="editProduct(${p.id})">
          Editar Produto
        </button>

      </div>

    </div>
  `).join('');
}

// FUNÇÃO: saveProduct()
// Salva produto novo ou editado no localStorage.

       async function saveProduct() {
        const id = document.getElementById('edit-prod-id').value;

        const data = {
          name: document.getElementById('prod-name').value,
          price: parseFloat(document.getElementById('prod-price').value),
          price_old: parseFloat(document.getElementById('prod-price-old').value) || 0,
          stock: parseInt(document.getElementById('prod-stock').value) || 0,
          img: document.getElementById('prod-img').value,
          desc: document.getElementById('prod-desc').value,
          is_promo: document.getElementById('prod-is-promo').value === 'true',
          active: true
        };

        if (!data.name || isNaN(data.price)) {
          return alert('Preencha Nome e Preço!');
        }

        let error;

        if (id) {
          // 🔥 UPDATE
          ({ error } = await sb
            .from('products')
            .update(data)
            .eq('id', id));
        } else {
          // 🔥 INSERT
          ({ error } = await sb
            .from('products')
            .insert([data]));
        }

        if (error) {
          console.error(error);
          alert('Erro ao salvar produto');
          return;
        }

        await loadProducts();
        closeModal('modal-produto');
      }

// FUNÇÃO: prepareNewProduct()
// Limpa o modal para cadastrar um novo produto.

        function prepareNewProduct() {
            document.getElementById('edit-prod-id').value = '';
            document.getElementById('prod-name').value = '';
            document.getElementById('prod-price').value = '';
            document.getElementById('prod-price-old').value = '';
            document.getElementById('prod-stock').value = '';
            document.getElementById('prod-img').value = '';
            document.getElementById('prod-desc').value = '';
            document.getElementById('prod-is-promo').value = 'false';
            document.getElementById('prod-modal-title').innerText = 'Novo Produto';
            document.getElementById('btn-del-prod').style.display = 'none';
            openModal('modal-produto');
        }

// FUNÇÃO: editProduct(id)
// Abre o modal de produto preenchido para edição.

        function editProduct(id) {
            
          const p = products.find(x => x.id === id);
          if (!p) return;

            document.getElementById('edit-prod-id').value = p.id;
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-price').value = p.price;
            document.getElementById('prod-price-old').value = p.priceOld ?? '';
            document.getElementById('prod-stock').value = p.stock;
            document.getElementById('prod-img').value = p.img || '';
            document.getElementById('prod-desc').value = p.desc || '';
            document.getElementById('prod-is-promo').value = p.isPromo.toString();
            document.getElementById('prod-modal-title').innerText = 'Editar Produto';
            document.getElementById('btn-del-prod').style.display = 'block';
            openModal('modal-produto');
        }


      
// FUNÇÃO: deleteProduct()
// Remove um produto do localStorage.

       async function deleteProduct() {
        const id = document.getElementById('edit-prod-id').value;

        if (!confirm('Apagar permanentemente?')) return;

        const { error } = await sb
          .from('products')
          .delete()
          .eq('id', id);

        if (error) {
          console.error(error);
          alert('Erro ao deletar');
          return;
        }

        await loadProducts();
        closeModal('modal-produto');
      }

        // [BLOCO DASHBOARD]
// DASHBOARD

// FUNÇÃO: renderDashboard()
// Atualiza os números do dashboard e monta o gráfico Chart.js.
        function renderDashboard() {
            const completed = appointments.filter(a => a.status === 'completed');
            document.getElementById('dash-vendas').innerText = `R$ ${completed.reduce((s,a) => s+a.price, 0)}`;
            document.getElementById('dash-cortes').innerText = completed.length;
            const ctx = document.getElementById('chartFluxo').getContext('2d');
            if (fluxChart) fluxChart.destroy();
            fluxChart = new Chart(ctx, {
                type: 'bar',
                data: { labels: ['08h', '10h', '12h', '14h', '16h', '18h', '20h'], datasets: [{ label: 'Fluxo', data: [2, 5, 12, 4, 15, 20, 10], backgroundColor: '#008b8b' }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

// FUNÇÃO: checkNotifications()
// Mostra alerta para produtos com estoque menor que 5.

        function checkNotifications() {
            const low = products.filter(p => p.stock < 5);
            document.getElementById('notif-count').innerText = low.length;
            document.getElementById('notif-count').style.display = low.length > 0 ? 'block' : 'none';
            document.getElementById('notif-list').innerHTML = low.length ? 
                low.map(p => `<div class="notif-item"><i class="fas fa-exclamation-triangle"></i> ${p.name}: ${p.stock} restando</div>`).join('') :
                '<div style="padding:15px; text-align:center; color:var(--text-gray); font-size:12px;">Nenhum alerta.</div>';
        }

        // [BLOCO FUNÇÕES AUXILIARES / MODAIS / DATAS]
// UTILS

// FUNÇÃO: formatDate(d)
// Converte data yyyy-mm-dd para dd/mm.
        function formatDate(d) { const [y,m,d1] = d.split('-'); return `${d1}/${m}`; }        

// FUNÇÃO: openModal(id)
// Abre um modal. Se for o modal de agenda, também carrega serviços, barbeiros e horários.
        function openModal(id) { 
        document.getElementById(id).style.display = 'flex';

        if (id === 'modal-agenda') {
            renderServiceTags();  // ✅ renderiza tags de serviços
            loadBarbers();        // ✅ carrega barbeiros
            loadAvailableTimes(); // ✅ carrega horários
        }
        }

// FUNÇÃO: closeModal(id)
// Fecha um modal pelo ID.


        function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// FUNÇÃO: openChangePasswordModal()
// Abre modal para trocar senha.
        function openChangePasswordModal() {  document.getElementById('new-pass').value = '';  document.getElementById('confirm-pass').value = '';  openModal('modal-change-password');}        

// FUNÇÃO: openCreateUserModal()
// Abre modal para criar novo usuário.
function openCreateUserModal() {
  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-login').value = '';
  document.getElementById('new-user-email').value = '';
  document.getElementById('new-user-phone').value = '';
  document.getElementById('new-user-whatsapp').value = '';
  document.getElementById('new-user-pass').value = '';
  document.getElementById('new-user-role').value = 'barbeiro';

  openModal('modal-create-user');
}
// FUNÇÃO: createUser()
// Cria usuário novo na tabela `users` com permissões escolhidas.
        
async function createUser() {
  const name = document.getElementById('new-user-name').value.trim();
  const login = document.getElementById('new-user-login').value.trim();
  const email = document.getElementById('new-user-email').value.trim();
  const phone = document.getElementById('new-user-phone').value.trim();
  const whatsapp = document.getElementById('new-user-whatsapp').value.trim();
  const pass = document.getElementById('new-user-pass').value;
  const role = document.getElementById('new-user-role').value;

  const permissionEls = document.querySelectorAll(
    '#modal-create-user input[type="checkbox"]:checked'
  );

  const permissions = Array.from(permissionEls).map(p => p.value);

  if (!name || !login || !pass) {
    alert('Preencha nome, login e senha');
    return;
  }

  const newUser = {
    id: Date.now(),
    name,
    login,
    email,
    phone,
    whatsapp,
    password: pass,
    mustChangePassword: true,
    role,
    permissions,
    active: true
  };

  const { error } = await sb.from('users').insert([newUser]);

  if (error) {
    console.error(error);
    alert('Erro ao criar usuário');
    return;
  }

  closeModal('modal-create-user');
  renderUsers();
}
// FUNÇÃO: saveNewPassword()
// Salva nova senha do usuário logado no Supabase.

      async function saveNewPassword() {
  const pass = document.getElementById('new-pass').value;
  const confirm = document.getElementById('confirm-pass').value;

  if (!pass || pass.length < 4) {
    alert('Senha muito curta.');
    return;
  }

  if (pass !== confirm) {
    alert('As senhas não coincidem.');
    return;
  }

  await sb
    .from('users')
    .update({
      password: pass,
      mustChangePassword: false
    })
    .eq('id', currentUser.id);

  currentUser.password = pass;
  currentUser.mustChangePassword = false;

  closeModal('modal-change-password');
}

// FUNÇÃO: openResetPasswordModal(userId)
// Reseta a senha de um usuário para 1234 e obriga troca depois.


        
       async function openResetPasswordModal(userId) {

  if (!confirm('Resetar senha para 1234?')) return;

  const { error } = await sb
    .from('users')
    .update({
      password: '1234',
      mustChangePassword: true
    })
    .eq('id', userId);

  if (error) {
    console.error(error);
    alert('Erro ao redefinir senha');
    return;
  }

  alert('✅ Senha redefinida para 1234');
}

// FUNÇÃO: changeDate(v)
// Troca a data selecionada na agenda e recarrega a lista.
        function changeDate(v) { selectedDate = v; document.getElementById('display-date').innerText = formatDate(v); renderAgenda(); closeModal('modal-calendar'); }

// FUNÇÃO: renderUsers()
// Lista usuários/equipe. Apenas admin consegue ver a listagem completa.
       
      async function renderUsers() {
  const box = document.getElementById('user-list');

  if (currentUser.role !== 'admin') {
    box.innerHTML = '<p style="color:var(--text-gray)">Acesso restrito.</p>';
    return;
  }

  const { data: users, error } = await sb
    .from('users')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Erro ao carregar usuários:', error);
    box.innerHTML = '<p>Erro ao carregar usuários</p>';
    return;
  }

  box.innerHTML = `
    <button class="btn-primary" onclick="openCreateUserModal()">
      + Criar novo usuário
    </button>

    ${(users || []).map(u => `
      <div class="card" style="margin-top:15px">
        <h4>${u.name}</h4>

        <p style="font-size:12px;color:var(--text-gray)">
          Login: <strong>${u.login}</strong><br>
          E-mail: ${u.email || '-'}<br>
          WhatsApp: ${u.whatsapp || '-'}<br>
          Perfil: ${u.role}<br>
          Permissões: ${(u.permissions || []).join(', ')}
        </p>

        <button class="btn-action btn-confirm"
          onclick="editUser(${u.id})">
          ✏️ Editar usuário
        </button>
      </div>
    `).join('')}
  `;
}

// [BLOCO BLOQUEIOS]
// FUNÇÃO: renderBlocks()
// Renderiza bloqueios de horário salvos localmente.
        function renderBlocks() { document.getElementById('block-list').innerHTML = blocks.map(b => `<div class="card" style="display:flex; justify-content:space-between;"><span>${b.start} às ${b.end}</span><i class="fas fa-trash" onclick="removeBlock(${b.id})" style="cursor:pointer; color:var(--danger)"></i></div>`).join(''); }

// FUNÇÃO: addBlock()
// Adiciona um intervalo bloqueado na lista local.
        function addBlock() {
            const s = document.getElementById('block-start').value;
            const e = document.getElementById('block-end').value;
            if(!s || !e) return alert('Horários!');
            blocks.push({ id: Date.now(), start: s, end: e });
            renderAll();
        }

// FUNÇÃO: removeBlock(id)
// Remove bloqueio de horário pelo ID.
        function removeBlock(id) { blocks = blocks.filter(x => x.id !== id); renderAll(); }

// FUNÇÃO: generateFullReport()
// Hoje apenas mostra um alerta. Aqui pode nascer o relatório completo futuramente.
        function generateFullReport() { alert('Relatório gerado e salvo no histórico do sistema!'); }

// FUNÇÃO: generateTimeSlots()
// Gera horários de 08:00 até 22:00, pulando de 30 em 30 minutos.
    
        function generateTimeSlots() {
            const slots = [];

            let start = 8 * 60;  // 08:00
            let end   = 22 * 60; // 22:00

            while (start < end) {
                const h = String(Math.floor(start / 60)).padStart(2, '0');
                const m = String(start % 60).padStart(2, '0');

                slots.push(`${h}:${m}`);
                start += 30;
            }

            return slots;
        }

// FUNÇÃO: isTimeBlocked(time, barberId, duration)
// Verifica se um horário conflita com outro agendamento do mesmo barbeiro no mesmo dia.

        function isTimeBlocked(time, barberId, duration) {
            const toMin = t => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            const start = toMin(time);
            const end = start + duration;

            const sameDay = appointments.filter(a =>
                String(a.barberId) === String(barberId) &&
                a.date === document.getElementById('app-date').value &&
                a.status !== 'cancelled'
            );

            for (let a of sameDay) {
                const aStart = toMin(a.time);
                const aEnd = aStart + (a.duration || 30);

                if (
                (start >= aStart && start < aEnd) ||
                (end > aStart && end <= aEnd) ||
                (start <= aStart && end >= aEnd)
                ) {
                return true;
                }
            }

            return false;
            }

// FUNÇÃO: loadAvailableTimes()
// Recalcula os horários disponíveis conforme barbeiro, data e duração dos serviços selecionados.
            
            
          function loadAvailableTimes() {
            const barberSelect = document.getElementById('app-barber');
            const select = document.getElementById('app-time');

            // ✅ Proteção: select não existe
            if (!select) return;

            // ✅ Proteção: barbeiro não selecionado
            if (!barberSelect || !barberSelect.value) {
                select.innerHTML = '<option>Selecione um barbeiro</option>';
                return;
            }

            const barberId = String(barberSelect.value);
            const tags = document.querySelectorAll('.tag.selected');

            let duration = 0;

            // ✅ Soma duração
            tags.forEach(t => {
                const service = services.find(s => s.name === t.dataset.name);
                if (service && service.duration) {
                duration += service.duration;
                }
            });

            // ✅ fallback padrão
            if (!duration) duration = 30;

            const allSlots = generateTimeSlots();

            // ✅ Geração dos horários
            select.innerHTML = allSlots.map(t => {
                const blocked = isTimeBlocked(t, barberId, duration);

                return `
                <option value="${t}" ${blocked ? 'disabled' : ''}>
                    ${t}${blocked ? ' (ocupado)' : ''}
                </option>
                `;
            }).join('');

            // ✅ Seleciona automaticamente o primeiro disponível
            const firstAvailable = select.querySelector('option:not([disabled])');
            if (firstAvailable) {
                firstAvailable.selected = true;
            }
            }

// FUNÇÃO: loadBarbers()
// Carrega usuários com perfil barbeiro e ativos para o select da agenda.
           async function loadBarbers() {
            const { data: users } = await sb.from('users').select('*');

            const barbers = users.filter(u =>
                u.role === 'barbeiro' && u.active
            );

            const select = document.getElementById('app-barber');

            select.innerHTML = barbers.map(b =>
                `<option value="${b.id}">${b.name}</option>`
            ).join('');
            }

// FUNÇÃO: renderServiceTags()
// Carrega serviços ativos e cria as tags clicáveis no modal de agendamento.

            
          async function renderServiceTags() {
  const { data } = await sb.from('services').select('*');
  services = data || [];

  const box = document.getElementById('service-select');

  const activeServices = services.filter(s => s.active);

  box.innerHTML = activeServices.map(s => `
    <span class="tag"
      data-price="${s.price || 0}"
      data-name="${s.name}">
      ${s.name} ${s.price ? 'R$ ' + s.price : ''}
    </span>
  `).join('');

  box.querySelectorAll('.tag').forEach(t => {
    t.onclick = () => {
      t.classList.toggle('selected');
      loadAvailableTimes();
    };
  });
}
        
            // EVENTO GLOBAL:
// Observa mudanças no checkbox `service-no-price`.
// Quando marcado, desativa o campo de preço do serviço.
document.addEventListener('change', (e) => {
            if (e.target.id === 'service-no-price') {
                const input = document.getElementById('service-price');
                input.disabled = e.target.checked;
                if (e.target.checked) input.value = '';
            }
            });

// FUNÇÃO: loadAppointments()
// Busca agendamentos no Supabase, atualiza `appointments` e renderiza a agenda.




            async function loadAppointments() {
            const { data, error } = await sb
                .from('appointments')
                .select('*')
                .order('date', { ascending: true });

            if (error) {
                console.error('Erro Supabase:', error);
                return;
            }

            appointments = data || [];
            renderAgenda();
            }

// [BLOCO EXPORTAÇÃO PARA O HTML]
// Global
// Aqui as funções ficam acessíveis para os botões do painel.html, por exemplo onclick="saveService()". 


window.doLogin = doLogin;
window.doLogout = doLogout;
window.toggleSidebar = toggleSidebar;
window.toggleNotifDropdown = toggleNotifDropdown;
window.navigate = navigate;
window.openModal = openModal;
window.closeModal = closeModal;

// Agenda
window.saveAppointment = saveAppointment;
window.confirmApp = confirmApp;
window.completeApp = completeApp;
window.cancelApp = cancelApp;

// Produtos
window.prepareNewProduct = prepareNewProduct;
window.editProduct = editProduct;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;

// Serviços
window.openServiceModal = openServiceModal;
window.editService = editService;
window.saveService = saveService;
window.deleteService = deleteService;

// Usuários
window.editUser = editUser;
window.saveUserEdit = saveUserEdit;
window.deleteUser = deleteUser;
window.openCreateUserModal = openCreateUserModal;
window.createUser = createUser;
window.openResetPasswordModal = openResetPasswordModal;

// Outros
window.changeDate = changeDate;
window.addBlock = addBlock;
window.removeBlock = removeBlock;
window.generateFullReport = generateFullReport;
window.saveNewPassword = saveNewPassword;


// BD
window.sb = sb;
window.togglePassword = togglePassword;
window.openForgotPasswordModal = openForgotPasswordModal;
window.requestPasswordReset = requestPasswordReset;
window.confirmPasswordReset = confirmPasswordReset;
window.showLoginMsg = showLoginMsg;
// ======================
// LOGIN MELHORADO (UX)
// ======================

// mostrar/ocultar senha
function togglePassword() {
  const input = document.getElementById('login-pass');
  input.type = input.type === 'password' ? 'text' : 'password';
}

let resetUserId = null;

function openForgotPasswordModal() {
  document.getElementById('reset-identifier').value = '';
  document.getElementById('reset-code').value = '';
  document.getElementById('reset-new-pass').value = '';
  document.getElementById('reset-confirm-pass').value = '';
  document.getElementById('reset-step-code').style.display = 'none';

  const msg = document.getElementById('reset-msg');
  msg.style.display = 'none';
  msg.innerText = '';

  openModal('modal-forgot-password');
}

function showResetMsg(text, type = 'info') {
  const msg = document.getElementById('reset-msg');
  msg.style.display = 'block';
  msg.style.color = type === 'error' ? '#ff6b6b' : 'var(--text-gray)';
  msg.innerText = text;
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

async function requestPasswordReset() {
  const identifier = document.getElementById('reset-identifier').value.trim();

  if (!identifier) {
    showResetMsg('Informe seu e-mail, usuário ou telefone.', 'error');
    return;
  }

  showResetMsg('Enviando código...');

  const identifierLower = identifier.toLowerCase();
  const identifierPhone = normalizePhone(identifier);

  // Procura o usuário no painel para permitir validar o código depois
  const { data: users, error: usersError } = await sb.from('users').select('*');

  if (usersError) {
    console.error(usersError);
    showResetMsg('Erro de conexão. Tente novamente.', 'error');
    return;
  }

 const user = (users || []).find(u => {
  const login = (u.login || '').toLowerCase();
  const email = (u.email || '').toLowerCase();
  const phone = normalizePhone(u.phone);
  const whatsapp = normalizePhone(u.whatsapp);

  return (
    (login === identifierLower ||
     email === identifierLower ||
     phone === identifierPhone ||
     whatsapp === identifierPhone)
     && email // ✅ só aceita se tiver e-mail
  );
});
  if (!user) {
    showResetMsg('Se os dados existirem, você receberá um código.');
    return;
  }



  resetUserId = user.id;

  const { data, error } = await sb.functions.invoke('send-reset-code', {
    body: {
      identifier
    }
  });

  if (error) {
    console.error(error);
    showResetMsg('Erro ao enviar código. Tente novamente.', 'error');
    return;
  }

  if (data && data.error) {
    console.error(data);
    showResetMsg(data.error, 'error');
    return;
  }

  document.getElementById('reset-step-code').style.display = 'block';

  showResetMsg('Código enviado para o e-mail cadastrado.');
}

async function confirmPasswordReset() {
  const identifier = document.getElementById('reset-identifier').value.trim();
  const code = document.getElementById('reset-code').value.trim();
  const pass = document.getElementById('reset-new-pass').value;
  const confirm = document.getElementById('reset-confirm-pass').value;

  if (!identifier) {
    showResetMsg('Informe seu e-mail, usuário ou telefone.', 'error');
    return;
  }

  if (!code || !pass || !confirm) {
    showResetMsg('Preencha código e nova senha.', 'error');
    return;
  }

  if (pass.length < 4) {
    showResetMsg('Senha muito curta.', 'error');
    return;
  }

  if (pass !== confirm) {
    showResetMsg('As senhas não coincidem.', 'error');
    return;
  }

  showResetMsg('Validando código...');

  const { data, error } = await sb.functions.invoke('confirm-reset-code', {
    body: {
      identifier,
      code,
      password: pass
    }
  });

  if (error) {
    console.error('Erro confirm-reset-code:', error);
    showResetMsg('Erro ao validar código. Veja o console.', 'error');
    return;
  }

  if (data && data.error) {
    console.error(data);
    showResetMsg(data.error, 'error');
    return;
  }

  showResetMsg('Senha alterada com sucesso ✅');

  setTimeout(() => {
    closeModal('modal-forgot-password');
  }, 1500);
}
// CAPS LOCK aviso
document.getElementById('login-pass')?.addEventListener('keyup', function(e){
  const caps = e.getModifierState && e.getModifierState('CapsLock');
  document.getElementById('caps-warning').style.display = caps ? 'block' : 'none';
});

// mensagem dentro do card
function showLoginMsg(msg) {
  const box = document.getElementById('login-msg');
  box.style.display = 'block';
  box.innerText = "⚠ " + msg;
}
