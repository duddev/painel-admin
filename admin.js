import { sb } from './supabase.js';

let services = [];

  
const SECTION_PERMISSION = {
  'sec-agenda': 'agenda',
  'sec-produtos': 'produtos',
  'sec-servicos': 'servicos',
  'sec-usuarios': 'usuarios',
  'sec-horarios': 'horarios',
  'sec-dash': 'dashboard'
};


// =======================
// SERVIÇOS – PAINEL ADMIN
// =======================


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

async function deleteService() {
  const id = document.getElementById('service-id').value;

  if (!confirm('Excluir?')) return;

  await sb.from('services').delete().eq('id', id);

  closeModal('modal-service');
  renderServices();
}



 // =======================
  // USUÁRIOS / BARBEIROS
  // =======================

  

    let currentUser = null;


        let appointments = [];
        let products = JSON.parse(localStorage.getItem('gp_prods')) || [
            {id: 1, name: 'Pomada Matte', price: 45.00, priceOld: 55.00, stock: 12, img: '', desc: 'Fixação extra forte para o dia todo.', isPromo: true},
            {id: 2, name: 'Óleo para Barba', price: 35.00, priceOld: 0, stock: 3, img: '', desc: 'Hidratação profunda e brilho.', isPromo: false}
        ];
        let blocks = JSON.parse(localStorage.getItem('gp_blocks')) || [];
        let selectedDate = new Date().toISOString().split('T')[0];
        let fluxChart = null;

        
            window.onload = () => {
                const saved = localStorage.getItem('gp_logged_user');
                if (saved) {
                    currentUser = JSON.parse(saved);
                    document.getElementById('login-screen').style.display = 'none';
                    initApp();
                }
                };


        
        async function doLogin() {
  const login = document.getElementById('login-user').value.trim();
  const pass  = document.getElementById('login-pass').value;

  const { data: users } = await sb.from('users').select('*');

  const found = users.find(u => u.login === login && u.password === pass);

  if (!found) {
    document.getElementById('login-error').innerText = 'Usuário ou senha inválidos';
    document.getElementById('login-error').style.display = 'block';
    return;
  }

  currentUser = found;
  localStorage.setItem('gp_logged_user', JSON.stringify(found));

  document.getElementById('login-screen').style.display = 'none';
  initApp();
}
       

        function doLogout() {  localStorage.removeItem('gp_logged_user');location.reload();}



        
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

        function renderAll() {
            renderAgenda();
            renderProducts();
            renderServices();
            renderUsers();
            renderBlocks();
            checkNotifications();
        }


        function save() {
            localStorage.setItem('gp_apps', JSON.stringify(appointments));
            localStorage.setItem('gp_prods', JSON.stringify(products));
            localStorage.setItem('gp_blocks', JSON.stringify(blocks));
        }

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('sidebar-overlay').classList.toggle('active');
        }

       
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


        function toggleNotifDropdown() {
            document.getElementById('notif-dropdown').classList.toggle('active');
        }

        async function editUser(userId) {
  const { data: users } = await sb.from('users').select('*');

  const user = users.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('edit-user-name').value = user.name;
  document.getElementById('edit-user-login').value = user.login;
  document.getElementById('edit-user-role').value = user.role;
  document.getElementById('edit-user-active').checked = user.active;

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

       async function saveUserEdit() {
  const id = Number(document.getElementById('edit-user-id').value);

  const permissions = Array.from(
    document.querySelectorAll('#edit-user-permissions .tag.selected')
  ).map(t => t.dataset.perm);

  const { error } = await sb
    .from('users')
    .update({
      name: document.getElementById('edit-user-name').value,
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

       async function deleteUser() {
  const id = Number(document.getElementById('edit-user-id').value);

  if (!confirm('Excluir usuário?')) return;

  await sb.from('users').delete().eq('id', id);

  closeModal('modal-edit-user');
  renderUsers();
}


        // AGENDA
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

       async function confirmApp(id) {
            await sb
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', id);

            loadAppointments();
        }
        
        async function completeApp(id) {
            await sb
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', id);

            loadAppointments();
        }

        async function cancelApp(id) {
            if (!confirm('Cancelar?')) return;

            await sb
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

            loadAppointments();
        }

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


        // PRODUTOS
        function renderProducts() {
            const list = document.getElementById('product-list');
            list.innerHTML = products.map(p => `
                <div class="product-card">
                    ${p.isPromo ? '<div class="promo-tag">Promoção</div>' : ''}
                    <div class="product-image-container">
                        ${p.img ? `<img src="${p.img}">` : '<div class="no-image"><i class="fas fa-box"></i></div>'}
                    </div>
                    <div class="product-info">
                        <span class="product-name">${p.name}</span>
                        <p class="product-desc">${p.desc || 'Sem descrição.'}</p>
                        <div class="product-pricing">
                            <span class="price-current">R$ ${p.price.toFixed(2)}</span>
                            ${p.priceOld > 0 ? `<span class="price-old">R$ ${p.priceOld.toFixed(2)}</span>` : ''}
                        </div>
                        <div class="stock-info">
                            <span>Estoque</span>
                            <span class="stock-status ${p.stock < 5 ? 'stock-low' : 'stock-ok'}">${p.stock} unid.</span>
                        </div>
                        <button class="btn-primary" style="padding: 8px; font-size: 12px;" onclick="editProduct(${p.id})">Editar Produto</button>
                    </div>
                </div>
            `).join('');
        }

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

        function editProduct(id) {
            const p = products.find(x => x.id === id);
            document.getElementById('edit-prod-id').value = p.id;
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-price').value = p.price;
            document.getElementById('prod-price-old').value = p.priceOld || '';
            document.getElementById('prod-stock').value = p.stock;
            document.getElementById('prod-img').value = p.img || '';
            document.getElementById('prod-desc').value = p.desc || '';
            document.getElementById('prod-is-promo').value = p.isPromo.toString();
            document.getElementById('prod-modal-title').innerText = 'Editar Produto';
            document.getElementById('btn-del-prod').style.display = 'block';
            openModal('modal-produto');
        }

        function saveProduct() {
            const id = document.getElementById('edit-prod-id').value;
            const data = {
                name: document.getElementById('prod-name').value,
                price: parseFloat(document.getElementById('prod-price').value),
                priceOld: parseFloat(document.getElementById('prod-price-old').value) || 0,
                stock: parseInt(document.getElementById('prod-stock').value),
                img: document.getElementById('prod-img').value,
                desc: document.getElementById('prod-desc').value,
                isPromo: document.getElementById('prod-is-promo').value === 'true'
            };
            if(!data.name || isNaN(data.price)) return alert('Preencha Nome e Preço!');
            if(id) {
                const idx = products.findIndex(p => p.id == id);
                products[idx] = { ...products[idx], ...data };
            } else {
                products.push({ id: Date.now(), ...data });
            }

            
            // ✅ AQUI O FIX
            localStorage.setItem('gp_prods', JSON.stringify(products));

            renderAll();
            closeModal('modal-produto');

        }

        function deleteProduct() {
            const id = document.getElementById('edit-prod-id').value;
            if(confirm('Apagar permanentemente?')) {
                products = products.filter(p => p.id != id);

                
                // ✅ salvar depois de remover
                localStorage.setItem('gp_prods', JSON.stringify(products));

                renderAll(); closeModal('modal-produto');
            }
        }

        // DASHBOARD
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

        function checkNotifications() {
            const low = products.filter(p => p.stock < 5);
            document.getElementById('notif-count').innerText = low.length;
            document.getElementById('notif-count').style.display = low.length > 0 ? 'block' : 'none';
            document.getElementById('notif-list').innerHTML = low.length ? 
                low.map(p => `<div class="notif-item"><i class="fas fa-exclamation-triangle"></i> ${p.name}: ${p.stock} restando</div>`).join('') :
                '<div style="padding:15px; text-align:center; color:var(--text-gray); font-size:12px;">Nenhum alerta.</div>';
        }

        // UTILS
        function formatDate(d) { const [y,m,d1] = d.split('-'); return `${d1}/${m}`; }        
        function openModal(id) { 
        document.getElementById(id).style.display = 'flex';

        if (id === 'modal-agenda') {
            renderServiceTags();  // ✅ renderiza tags de serviços
            loadBarbers();        // ✅ carrega barbeiros
            loadAvailableTimes(); // ✅ carrega horários
        }
        }


        function closeModal(id) { document.getElementById(id).style.display = 'none'; }
        function openChangePasswordModal() {  document.getElementById('new-pass').value = '';  document.getElementById('confirm-pass').value = '';  openModal('modal-change-password');}        
        function openCreateUserModal() {  document.getElementById('new-user-name').value = '';  document.getElementById('new-user-login').value = '';  document.getElementById('new-user-pass').value = '';  document.getElementById('new-user-role').value = 'barbeiro';  openModal('modal-create-user');}
        
async function createUser() {
  const name = document.getElementById('new-user-name').value.trim();
  const login = document.getElementById('new-user-login').value.trim();
  const pass = document.getElementById('new-user-pass').value;
  const role = document.getElementById('new-user-role').value;

  const permissionEls = document.querySelectorAll(
    '#modal-create-user input[type="checkbox"]:checked'
  );
  const permissions = Array.from(permissionEls).map(p => p.value);

  if (!name || !login || !pass) {
    alert('Preencha tudo');
    return;
  }

  const newUser = {
    id: Date.now(),
    name,
    login,
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
        function changeDate(v) { selectedDate = v; document.getElementById('display-date').innerText = formatDate(v); renderAgenda(); closeModal('modal-calendar'); }
       
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
        function renderBlocks() { document.getElementById('block-list').innerHTML = blocks.map(b => `<div class="card" style="display:flex; justify-content:space-between;"><span>${b.start} às ${b.end}</span><i class="fas fa-trash" onclick="removeBlock(${b.id})" style="cursor:pointer; color:var(--danger)"></i></div>`).join(''); }
        function addBlock() {
            const s = document.getElementById('block-start').value;
            const e = document.getElementById('block-end').value;
            if(!s || !e) return alert('Horários!');
            blocks.push({ id: Date.now(), start: s, end: e });
            renderAll();
        }
        function removeBlock(id) { blocks = blocks.filter(x => x.id !== id); renderAll(); }
        function generateFullReport() { alert('Relatório gerado e salvo no histórico do sistema!'); }
    
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
        
            document.addEventListener('change', (e) => {
            if (e.target.id === 'service-no-price') {
                const input = document.getElementById('service-price');
                input.disabled = e.target.checked;
                if (e.target.checked) input.value = '';
            }
            });




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

// Global 


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
