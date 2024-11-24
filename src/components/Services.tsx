const Services = () => {
    return (
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">企業服務</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">服務方案 1</h3>
            <p>智能熱食取餐機服務...</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">服務方案 2</h3>
            <p>辦公室團購便當服務...</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">服務方案 3</h3>
            <p>自動貨道機與冷櫃飲料機服務...</p>
          </div>
        </div>
      </div>
    )
  }
  
  export default Services