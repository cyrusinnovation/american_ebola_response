class CountryData
	UNITED_STATES_COUNTRY_CODE = '840'
	attr_accessor :name, :data, :dates

	def initialize(name, data, dates)
		@name = name
		@data = data
		@dates = dates
	end

	def normalize_data
		max_usa = @data.inject(0) { |memo, datum| memo > datum[1] ? memo : datum[1] }

		@data = @data.map { |datum| datum[0] / max_usa }
	end

	def data_hash
		@dates.zip(@data).inject({}) { |memo, (date, data)| memo[date] = data; memo }
	end

	def merge_data(country_data)
		if (country_data.name == UNITED_STATES_COUNTRY_CODE)
			max_value = 0
			country_data.data.each { |datum| max_value = (datum[1] > max_value ? datum[1] : max_value) }
			if max_value < 100
				return
			end
		end

		puts "Name mismatch: #{@name} #{country_data.name}" if @name && @name != country_data.name
		@name = country_data.name

		data1 = data_hash
		data2 = country_data.data_hash

		merged = data1.merge(data2)
		@dates = merged.keys.sort
		@data = @dates.map { |date| merged[date] }
	end
end