const { Pool } = require('pg');

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: "postgresql://postgres:zVDFeP9OIaa0a2Ab@db.ehrgyyehxkwrobdftxuk.supabase.co:5432/postgres?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function listProducts() {
  const client = await pool.connect();
  
  try {
    console.log('📦 LISTANDO PRODUTOS:');
    console.log('=' .repeat(80));
    
    const result = await client.query(`
      SELECT p.id, p.name, p.category, p.unit, p.price, p."isActive", 
             i.quantity, i."minQuantity", i."maxQuantity"
      FROM products p
      LEFT JOIN inventory i ON p.id = i."productId"
      ORDER BY p.name
    `);

    if (result.rows.length === 0) {
      console.log('❌ Nenhum produto encontrado.');
      return;
    }

    result.rows.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Categoria: ${product.category || 'N/A'}`);
      console.log(`   Unidade: ${product.unit || 'N/A'}`);
      console.log(`   Preço: R$ ${Number(product.price).toFixed(2)}`);
      console.log(`   Ativo: ${product.isActive ? '✅' : '❌'}`);
      console.log(`   Estoque: ${product.quantity || 0} (min: ${product.minQuantity || 0}, max: ${product.maxQuantity || 'N/A'})`);
      console.log('');
    });

    console.log(`📊 Total: ${result.rows.length} produtos`);
    
  } catch (error) {
    console.error('❌ Erro ao listar produtos:', error.message);
  } finally {
    client.release();
  }
}

async function deleteProduct(productId) {
  const client = await pool.connect();
  
  try {
    console.log(`🗑️  DELETANDO PRODUTO: ${productId}`);
    console.log('=' .repeat(80));
    
    // Verificar se o produto existe
    const productCheck = await client.query(
      'SELECT name FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      console.log('❌ Produto não encontrado.');
      return;
    }

    const productName = productCheck.rows[0].name;
    console.log(`📦 Produto encontrado: ${productName}`);

    // Verificar se há vendas associadas
    const salesCheck = await client.query(
      'SELECT COUNT(*) as count FROM sale_items WHERE "productId" = $1',
      [productId]
    );

    const salesCount = parseInt(salesCheck.rows[0].count);
    if (salesCount > 0) {
      console.log(`❌ Não é possível excluir. Produto tem ${salesCount} venda(s) associada(s).`);
      return;
    }

    // Deletar estoque
    const inventoryResult = await client.query(
      'DELETE FROM inventory WHERE "productId" = $1 RETURNING *',
      [productId]
    );

    if (inventoryResult.rows.length > 0) {
      console.log('✅ Estoque deletado.');
    }

    // Deletar produto
    await client.query('DELETE FROM products WHERE id = $1', [productId]);
    console.log('✅ Produto deletado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error.message);
  } finally {
    client.release();
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Listar produtos
    await listProducts();
  } else if (args[0] === 'delete' && args[1]) {
    // Deletar produto
    await deleteProduct(args[1]);
  } else {
    console.log('📖 USO:');
    console.log('  node list-products.js              # Listar produtos');
    console.log('  node list-products.js delete <id>  # Deletar produto');
    console.log('');
    console.log('📝 EXEMPLOS:');
    console.log('  node list-products.js');
    console.log('  node list-products.js delete product-1234567890');
  }
  
  await pool.end();
}

main().catch(console.error);
