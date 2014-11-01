class LineChartData
	def initialize(dates, title)
		@countries = {}
		@dates = dates
		@title = title
	end

	def dates
		@dates || @countries.values.dates
	end

	def title
		@title || @countries.keys[0]
	end

	def add_country(country_data)
		@countries[country_data.human_name] = country_data
	end

	def write_csv
		CSV.open("outputs/#{@title}.csv", 'w') do |writer|
			writer << header
			@countries.each do |country_name, country_data|
				writer << country_values(country_data)
			end
		end
	end

	private

	def header
		['Name'] + @dates
	end

	def country_values(country_data)
		values = @dates.map do |date|
			(country_data.data_for(date) * 100).round(1)
		end

		[country_data.human_name] + values
	end
end
