const Contact = () => {
    return (
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">聯絡我們</h2>
        <div className="max-w-md mx-auto">
          <form className="space-y-4">
            <div>
              <label className="block mb-2">姓名</label>
              <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block mb-2">電子郵件</label>
              <input type="email" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block mb-2">訊息</label>
              <textarea className="w-full p-2 border rounded" rows={4}></textarea>
            </div>
            <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
              送出
            </button>
          </form>
        </div>
      </div>
    )
  }
  
  export default Contact