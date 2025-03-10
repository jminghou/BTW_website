const Contact = () => {
    return (
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">聯絡我們</h2>
        <div className="max-w-md mx-auto">
          <form className="space-y-4">
            <div className="mb-2">
              <p className="mb-2">請問您身份的代表是？</p>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="identity" 
                    value="企業主" 
                    className="mr-2" 
                    required 
                  />
                  企業主
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="identity" 
                    value="餐廳" 
                    className="mr-2" 
                  />
                  餐廳
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="identity" 
                    value="其他" 
                    className="mr-2" 
                  />
                  其他
                </label>
              </div>
            </div>
            <div>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                placeholder="可以怎麼稱呼您 *" 
                required 
              />
            </div>
            <div>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                placeholder="您的單位/職稱" 
              />
            </div>
            <div>
              <input 
                type="email" 
                className="w-full p-2 border rounded" 
                placeholder="電子郵件 *" 
                required 
              />
            </div>
            <div>
              <input 
                type="tel" 
                className="w-full p-2 border rounded" 
                placeholder="電話 *" 
                required 
              />
            </div>
            <div>
              <textarea 
                className="w-full p-2 border rounded" 
                rows={4} 
                placeholder="請留下您的訊息"
              ></textarea>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <span className="text-red-500">*</span> 表示必填欄位
            </div>
            <button className="w-full bg-[#00bed6] text-white py-2 rounded hover:bg-[#ffb71b]">
              送出
            </button>
          </form>
        </div>
      </div>
    )
  }
  
  export default Contact