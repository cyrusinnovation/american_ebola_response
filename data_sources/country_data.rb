class CountryData
	attr_accessor :name, :data, :dates

	def initialize(name, data, dates)
		@name = name
		@data = normalize_data(data)
		@dates = dates
	end

	private

	def normalize_data(data)
		max_usa = data.inject(0) { |memo, datum| memo > datum[1] ? memo : datum[1] }

		data.map { |datum| datum[0] / max_usa }
	end
end